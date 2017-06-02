//
// Github Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")

DataEndpoint = require("./dataendpoint.js")
class GithubEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "api.github.com",
            path: "/repos/nebulouslabs/sia",
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

module.exports = GithubEndpoint