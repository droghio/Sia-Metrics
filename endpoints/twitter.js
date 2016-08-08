//
// Twitter Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")
const process = require("process")

DataEndpoint = require("./dataendpoint.js")
class TwitterEndpoint extends DataEndpoint {
    constructor(){
        super()
        if (process.env.TWITTER_TOKEN === undefined){
            this.errorLog("ERROR: Did you forget to define the TWITTER_TOKEN environment variable?")
        }
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "api.twitter.com",
            path: "/1.1/users/show.json?screen_name=siatechhq",
            headers: {
                "User-Agent": "Sia-Metrics",
                "Authorization": "Bearer " + process.env.TWITTER_TOKEN,
            }
        }, (data, res) => {
            data.date = new Date()
            data.statusCode = res.statusCode
            return data
        })
    }
}

module.exports = TwitterEndpoint

