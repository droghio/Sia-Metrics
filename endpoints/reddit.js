//
// Reddit Data Endpoint
//
// All endpoints must log data and return latest data.
//
const Path = require("path")

DataEndpoint = require("./dataendpoint.js")
class RedditEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
        this.fetchData = this.makeFetchData({
            hostname: "www.reddit.com",
            path: "/r/siacoin/new.json?sort=new",
            headers: {
                "User-Agent": "Sia-Metrics:droghio",
            }
        }, (data, res) => {
            data.date = new Date()
            data.statusCode = res.statusCode
            return data
        })
    }
}

module.exports = RedditEndpoint
