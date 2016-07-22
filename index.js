//
// Metric Logger
//
// Scrapes various data sources and visualizes
// collected data in a web ui.

const apiEndpoints = ["github.js"]
const data = require("./datalogger.js").init(apiEndpoints)
const express = require("express")
const app = express()
const process = require("process")

const PORT = process.env.SIA_METRIC_PORT || 8080

//Servers static files.
app.use(express.static("public"))
app.use("/charts/", express.static("node_modules/chart.js/dist/"))

//Data endpoint.
app.get("/data", (req, res) => {
    if (req.query.callback){
        res.send(`function ${req.query.callback}(callback){
            callback(${JSON.stringify(data.latest(req.query.length))})
        }`)
    } else {
        res.send(JSON.stringify(data.latest(req.query.length)))
    }
})

app.listen(PORT, () =>
    console.log(`Running server on port ${PORT}`)
)

//data.startLogging()
