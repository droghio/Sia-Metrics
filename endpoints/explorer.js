//
// Sia-Explorer Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")
const https = require("https")

DataEndpoint = require("./dataendpoint.js")
class ExplorerEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "explore.sia.tech",
            path: "/explorer",
            headers: {
                "User-Agent": "Sia-Metrics"
            }
        }, (data) => {
            data.date = new Date()
            return data
        })
    }
}

module.exports = ExplorerEndpoint
