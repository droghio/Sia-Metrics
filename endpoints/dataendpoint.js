//
// Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")
const fs = require("fs")
const https = require("https")

class DataEndpoint {
    constructor(){
        this.tmplog = []
        this.loggingInterval = undefined
        this.moduleName = Path.basename(__filename)
        this.logfile = undefined

        //How often to poll endpoints.
        this.logTimeInterval = 15*60*1000 //Once ever 15 minutes.

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
        fs.writeSync(this.logFile, JSON.stringify(data)+",\n")

        //Prevent too much data from being stored in memory.
        if (this.tmplog.length == 100){
            this.tmplog = this.tmplog.slice(-50)
        }

        this.tmplog.push(data)
        this.errorLog("Logging Data")
    }

    fetchData(){
        return new Promise( (resolve, reject) => resolve(
            { data: "Test Data", otherData: "Make sure you define a fetchData function!", date: new Date() }
        ))
    }

    makeFetchData(options, processData, isNotJSON){
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
        count = count || 5
        if (count <= this.tmplog.length){
            return this.tmplog.slice(-count)
        } else {
            this.errorLog("Asked for too much data, reloading log.")
            let tmpdata = ""
            tmpdata = fs.readFileSync(Path.join(__dirname, "../", "logs", this.moduleName+"on"), "utf8")
            tmpdata = tmpdata.trim().slice(0,-1)
            tmpdata = JSON.parse(`[${tmpdata}]`)
            return tmpdata.splice(-count)
        }
    }
}

module.exports = DataEndpoint
