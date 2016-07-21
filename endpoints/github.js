//
// Github Data Endpoint
//
// All endpoints must log data and return latest data.


module.exports = {
    startLogging: () => {
        console.log("Start Logging")
    },
    
    data: (count) => {
        return { data: "hi", otherData: "something", date: new Date() }
    }
}
