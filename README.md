# Sia-Metrics
Metric collection and display dashboard

## Overview

This is a simple data collection and display toolset. It is configured to monitor various data sources related to the Sia network.
Once the app is started it will poll the api endpoints every hour and display the latest data in a web dashboard.

## Running

To start the web server and data logging:

````
  npm install
  npm start
````

By default the server listens on port 8080 but can be overridden by setting an environment variable called `SIA_METRIC_PORT`.

## Tracking New Metrics

There are two main components to the Metrics platform. A data endpoint that is loaded and used by the datalogger, and a data parser that is used in the UI to generate the chart data set and current statistics displayed on the home screen.

### Data Endpoints

Most data endpoints can directly inherit from the `DataEndpoint` class. This class provides default behavior for all necessary endpoint functions, namely fetching and logging data. In most cases a new endpoint can be added by subclassing `DataEndpoint` and defining a custom `fetchData` function.

For example to create a github endpoint:
````
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
        }, (data) => {
            data.date = new Date()
            return data
        })
    }
}
````

The `makeFetchData` helper function will generate an https request with the passed options using Node's builtin https library and pass the resulting decoded JSON and response objects to the provided callback. This callback can be used to clean or alter the response data before it is passed to the `logData` function. If the response to the fetchData function is not JSON you can pass a `true` flag after the callback to return the raw reponse string.

It is important to specify a unique and identifiable `moduleName` as this will be used to connect the data with the proper parser function in the UI. It is encouraged to name your module after the file name of the endpoint. For example the github endpoint exists in github.js and thus the module name is "github.js".

Subclasses of `dataendpoint` will by default log data in a `logs/__module_name__.json` file. The log format is currently a JSON like format that consists of one JSON object per line. To decode the JSON file it is necessary to enclose the file contents in square brackets before attempting to parse.

Once your endpoint code is complete be sure to include the file name in the `datalogger.init` call. For example to add the endpoint contained in github.js to the following data logger:

````
const data = require("./datalogger.js").init(["explorer.js"])
````

You must add a "github.js" token:

````
const data = require("./datalogger.js").init(["github.js", "explorer.js"])
````
