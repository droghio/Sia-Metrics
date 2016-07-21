//
// Metric Logger
//
// Scrapes various data sources and visualizes
// collected data in a web ui.

const data = require("datalogger.js").init(apiEndpoints)

data.startLogging()

setTimeout(() => {
    console.log(data.latest())
}, 1000)
