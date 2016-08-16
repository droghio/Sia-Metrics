//
// Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")
const fs = require("fs")
const https = require("https")

// Every 15 minutes
const defaultUpdateTime = 15*60*1000
const anHour = 60*60*1000
const aDay = 24*anHour

class DataEndpoint {
    constructor(){
        this.tmplog = []
        this.lastStatus = {} // Used for error checking.
        this.loggingInterval = undefined
        this.moduleName = Path.basename(__filename)
        this.logfile = undefined

        //How often to poll endpoints.
        this.logTimeInterval = defaultUpdateTime //Once ever 15 minutes.

        let logDirectory = Path.join(__dirname, "../", "logs")
        try {
            fs.statSync(logDirectory).isDirectory()
        } catch (e) {
            fs.mkdirSync(logDirectory)
        }
    }

    errorLog(data){
        console.log(`\t${this.moduleName}\t${Math.round(Number(new Date())/1000)}: ${data}`)
    }

    startLogging(){
        if (this.loggingInterval == undefined){
            if (!this.logfile){
                this.logFile = fs.openSync(Path.join(__dirname, "../", "logs", this.moduleName+"on"), "a+")
            }
            this.errorLog("Start Logging")
            this.loggingInterval = setInterval(() =>
                this.fetchData().then((data) =>
                    this.logData(data)
            ).catch((e) => this.errorLog(e)), this.logTimeInterval)
        } else {
            this.errorLog("ERROR: Already Logging")
        }
    }

    stopLogging(){
        if (this.loggingInterval){
            clearInterval(this.loggingInterval)
            this.loggingInterval = undefined
            fs.closeSync(this.logFile)
            this.logfile = undefined
        } else {
            this.errorLog("ERROR: Not Logging")
        }
    }
    
    logData(data){
        fs.writeSync(this.logFile, JSON.stringify(data).replace(/\n/g, "  ")+",\n")

        //Prevent too much data from being stored in memory.
        if (this.tmplog.length >= 400){
            this.tmplog = this.tmplog.slice(-200)
        }

        this.tmplog.push(data)
        this.errorLog("Logging Data")
    }

    fetchData(){
        return new Promise( (resolve, reject) => resolve(
            { data: "Test Data", otherData: "Make sure you define a fetchData function!", date: new Date() }
        ))
    }

    makeFetchData(options, processData, isNotJSON, processErr){
       return () => (
            new Promise( (resolve, reject) => {
                https.get(options, (res) => {
                    let buffer = ""
                    res.on("data", (data) => {
                       buffer += data
                    });

                    res.on("end", () => {
                        try {
                            const rawData = isNotJSON ? buffer : JSON.parse(buffer)
                            if (processData){
                                resolve(processData(rawData, res))
                            } else {
                                resolve(rawData)
                            }
                        } catch (e) {
                            this.errorLog(`ERROR: Problem when parsing buffer: ${e}`)
                            this.errorLog(`ERROR: Received data: ${buffer}`)
                            this.errorLog(`FALLING BACK TO ERROR OBJECT`)
                            resolve(processData({ error: e }, res))
                        }
                    })
                }).on("error", (err) => {
                    this.errorLog(err);
                    reject(err)
                });
            })
        )
    }

    data(count){
        // Set count to 0 to return all data.
        count = count === undefined ? 5 : count
        if (count !== 0 && count <= this.tmplog.length){
            // Return the "count" newest elements.
            return this.tmplog.slice(-count)
        } else {
            this.errorLog("Asked for too much data, reloading log.")
            let tmpdata = ""
            try {
                tmpdata = fs.readFileSync(Path.join(__dirname, "../", "logs", this.moduleName+"on"), "utf8")
                // Remove the ",\n" on the last element before attempting to parse.
                tmpdata = tmpdata.trim().slice(0,-1)
                tmpdata = JSON.parse(`[${tmpdata}]`)
                this.tmplog = tmpdata
                // Return the "count" newest elements.
                // NOTE: Since all data is wrapped in an object, we are dealing with a shallow copy.
                // This data must not be directly modified.
                return this.tmplog.slice(-count)
            } catch (e) {
                this.errorLog(`ERROR Reading from logs: ${e}, returning an empty array`)
                return []
            }
        }
    }

    // Checks the latest return data for any errors.
    // Returns an object describing whether a report should be sent (ie email)
    //   what the current state is, and how long the module has been in this state.
    checkStatus(){
        const currentStatus = {
            reportLevel: 0, // 0 = no report, 1 = primary, 2 = secondary, 3 = all
            lastChanged: new Date(),
            lastReport: null,
            status: "ok",
            message: "Service is operating within specified parameters."
        }

        const latestData = this.data(1)
        if ( latestData.length === 1 ){
            const service = latestData[0]
            if (!(service.statusCode < 400 || service.statusCode > 599)){

                // Service is down.
                currentStatus.status = "offline"
                if (currentStatus.status !== this.lastStatus.status){
                    // Service just went down.
                    currentStatus.reportLevel = 1
                    currentStatus.lastReport = new Date()
                    currentStatus.lastChanged = new Date()
                        // We use the current date instead of the one included in the data packet to prevent us from spamming reports if we reboot the server
                        // when it has recorded an error.
                    currentStatus.message = `http error - received status code ${service.statusCode}`
                }

                else {
                    // Service has been down.
                    currentStatus.lastChanged = this.lastStatus.lastChanged
                    currentStatus.message = this.lastStatus.message
                    if ( (new Date() - this.lastStatus.lastReported) > aDay){
                        // It has been more than 24 hours since the service has been down send a priority 3 report.
                        currentStatus.reportLevel = 3
                        currentStatus.lastReport = new Date()
                    }

                    else if ( (new Date() - this.lastStatus.lastReport) > anHour && this.lastStatus.reportLevel < 2) {
                        // Is has been more than an hour since the service went down and we haven't sent a secondary report.
                        currentStatus.reportLevel = 2
                        currentStatus.lastReport = new Date()
                    }
                }
            } // If service is up just return the default currentStatus object.

        } else {
            this.errorLog("ERROR Checking status, not enough data.")
            currentStatus.reportLevel = 1
            currentStatus.lastChanged = new Date()
            currentStatus.lastReport = new Date()
            currentStatus.status = "unknown"
            currentStatus.message = "Error checking status, not enough data."
        }

        this.lastStatus = currentStatus
        return currentStatus
    }

}

module.exports = DataEndpoint
