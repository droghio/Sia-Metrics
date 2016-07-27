//
// Forum Up Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")

DataEndpoint = require("./dataendpoint.js")
class ForumEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "forum.sia.tech",
            path: "/",
            headers: {
                "User-Agent": "Sia-Metrics"
            }
        }, (data, res) => {
            return { date: new Date(), statusCode: res.statusCode }
        }, true)
    }
}

module.exports = ForumEndpoint
