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
            path: "/api",
            headers: {
                "User-Agent": "Sia-Metrics"
            }
        }, (data, res) => {
            // The api response from the forum is too large for comfort, so
            // we only parse out the data we need.
            const parsedData = {}
            parsedData.date = new Date()
            parsedData.statusCode = res.statusCode
            parsedData.posts = data.categories.reduce((prev, cur) => prev+Number(cur.post_count), 0)
            return parsedData
        })
    }
}

module.exports = ForumEndpoint
