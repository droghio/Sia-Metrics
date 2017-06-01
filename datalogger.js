//
// Data Logger
//
// Loads provided enpoints and collets data into central data source.
//
const Path = require("path")

module.exports = {
    init: (endpointNames, callback) => {
        const dataEndpoints = {}

        let endpointsInited = 0
        endpointNames.forEach((name) => {
            let newEndpoint = require(Path.join(__dirname, "endpoints", name))
            dataEndpoints[name] = new newEndpoint()
            dataEndpoints[name].preloadData(() => {
                endpointsInited++
                if (endpointsInited === endpointNames.length){
                    callback()
                }
            })
        })

        const startLogging = () => {
            for (const key in dataEndpoints){
                dataEndpoints[key].startLogging()
            }
        }
 
        const stopLogging = () => {
            for (const key in dataEndpoints){
                dataEndpoints[key].stopLogging()
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
            stopLogging,
            latest,
            dataEndpoints,
        }
    }
}
