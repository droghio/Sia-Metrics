//
// Data Logger
//
// Loads provided enpoints and collets data into central data source.
//
Path = require("path")

module.exports = {
    init: (endpointNames) => {
        const dataEndpoints = {}

        endpointNames.forEach((name) => {
            dataEndpoints[name] = require(Path.join(__dirname, "endpoints", name))
        })

        const startLogging = () => {
            for (const key in dataEndpoints){
                dataEndpoints[key].startLogging()
            }
        }
    
        const latest = (count) => {
            const latestData = {}
            for (const key in dataEndpoints){
                latestData[key] = dataEndpoints[key].data(count)
            }
            return latestData
        }
    
        return {
            startLogging,
            latest
        }
    }
}
