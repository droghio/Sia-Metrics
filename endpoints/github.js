//
// Github Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")

//module.exports = {
//    init: () => {
//        let tmplog = []
//        let loggingInterval
//
//        const moduleName = Path.basename(__filename)
//        const errorLog = (data) => {
//            console.log(`\t${moduleName}: ${data}`)
//        }
//
//        const startLogging = () => {
//            if (loggingInterval == undefined){
//                errorLog("Start Logging")
//                loggingInterval = setInterval(() => fetchData().then(logData), 1000)
//            } else {
//                errorLog("ERROR: Already Logging")
//            }
//        }
//
//        const stopLogging = () => {
//            if (loggingInterval){
//                clearInterval(loggingInterval)
//                loggingInterval = undefined
//            } else {
//                errorLog("ERROR: Not Logging")
//            }
//        }
//        
//        const logData = (data) => {
//            errorLog(`Logging Data: ${JSON.stringify(data)}`)
//            tmplog.push(data)
//        }
// 
//        const fetchData = () => {
//            return new Promise( (resolve, reject) => resolve(
//                { data: "hi", otherData: "something", date: new Date() }
//            ))
//        }
//
//        const data = (count) => {
//            count = count || 5
//            return tmplog.slice(-count)
//        }
//
//        return ({
//            startLogging,
//            stopLogging,
//            data
//        })
//    }
//}


class DataEndpoint {
    constructor(){
        this.tmplog = []
        this.loggingInterval = undefined
        this.moduleName = Path.basename(__filename)
    }

    errorLog(data){
        console.log(`\t${this.moduleName}: ${data}`)
    }

    startLogging(){
        if (this.loggingInterval == undefined){
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
        } else {
            this.errorLog("ERROR: Not Logging")
        }
    }
    
    logData(data){
        this.errorLog(`Logging Data: ${JSON.stringify(data)}`)
        this.tmplog.push(data)
    }

    fetchData(){
        this.errorLog("Fetching data")
        return new Promise( (resolve, reject) => resolve(
            { data: "hi", otherData: "something", date: new Date() }
        ))
    }

    data(count){
        count = count || 5
        return this.tmplog.slice(-count)
    }
}

module.exports = DataEndpoint
