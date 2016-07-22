//
// Github Data Endpoint
//
// All endpoints must log data and return latest data.
//
Path = require("path")

DataEndpoint = require("./dataendpoint.js")
class GithubEndpoint extends DataEndpoint {
    constructor(){
        super()
        this.moduleName = Path.basename(__filename)
    }
}

module.exports = GithubEndpoint
