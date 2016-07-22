//
// Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")
const fs = require("fs")


class DataEndpoint {
    constructor(){
        this.tmplog = []
        this.loggingInterval = undefined
        this.moduleName = Path.basename(__filename)
        this.logfile = undefined

        let logDirectory = Path.join(__dirname, "../", "logs")
        try {
            fs.statSync(logDirectory).isDirectory()
        } catch (e) {
            fs.mkdirSync(logDirectory)
        }
    }

    errorLog(data){
        console.log(`\t${this.moduleName}: ${data}`)
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
            ), 1000)
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
        fs.writeSync(this.logFile, JSON.stringify(data)+",")

        //Prevent too much data from being stored in memory.
        if (this.tmplog.length == 100){
            this.tmplog = this.tmplog.slice(-50)
        }

        this.tmplog.push(data)
        this.errorLog(`Logging Data: ${JSON.stringify(data)}`)
    }

    fetchData(){
        return new Promise( (resolve, reject) => resolve(
            { data: "Test Data", otherData: "Make sure you define a fetchData function!", date: new Date() }
        ))
    }

    data(count){
        count = count || 5
        if (count <= this.tmplog.length){
            return this.tmplog.slice(-count)
        } else {
            this.errorLog("Asked for too much data, reloading log.")
            let tmpdata = ""
            tmpdata = fs.readFileSync(Path.join(__dirname, "../", "logs", this.moduleName+"on")).slice(0,-1)
            tmpdata = JSON.parse(`[${tmpdata}]`)
            return tmpdata.splice(-count)
        }
    }

    shutdown(){
        fs.closeSync(this.logFile)
    }
}

module.exports = DataEndpoint
