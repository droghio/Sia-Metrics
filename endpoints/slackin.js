//
// Slackin Up Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")

DataEndpoint = require("./dataendpoint.js")
class SlackinEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "slackin.sia.tech",
            path: "/data",
            headers: {
                "User-Agent": "Sia-Metrics"
            }
        }, (data, res) => {
            data.date = new Date()
            data.statusCode = res.statusCode
            return data
        })
    }
}

module.exports = SlackinEndpoint

