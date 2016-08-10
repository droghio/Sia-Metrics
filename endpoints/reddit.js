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
            
            if (data.error === undefined){
                if (data.data && data.data.children){
                    for (let i = 0; i < data.data.children.length; i++){
                        //Remove unnecessary data from reddit post.
                        data.data.children[i].data = {
                            author: data.data.children[i].data.author,
                            created_utc: data.data.children[i].data.created_utc,
                            downs: data.data.children[i].data.downs,
                            id: data.data.children[i].data.id,
                            num_comments: data.data.children[i].data.num_comments,
                            score: data.data.children[i].data.score,
                            title: data.data.children[i].data.title,
                            ups: data.data.children[i].data.ups,
                            url: data.data.children[i].data.url
                        }
                    }
                }
            }

            return data
        })
    }
}

module.exports = RedditEndpoint
