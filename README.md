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

### Data Parsers

Most data parsers will closely resemble the `github-parser` shown below. The purpose of a parser is to take logged data (usually api calls) and format them for the ui and `chart.js`. This formatting creates `dataset` and `chartStyle` objects that are passed to the dashboard building scripts through the parser's callback.

For example a `github-parser` that extracts a repo's number of stars, forks, and watchers looks like this:
````
const githubParser = (chartName, chartData, callback) => {
    //We are collecting three metrics:
    //    Stars
    //    Forks
    //    Subscribers

    let dataset = {
        datasets: [
            { label: "stars", data: [], yAxisID: "1" },
            { label: "watches", data: [], yAxisID: "2" },
            { label: "forks", data: [], yAxisID: "2"}
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        dataset.datasets[0].data.push({ x: dataPoint.date, y: dataPoint.stargazers_count })
        dataset.datasets[1].data.push({ x: dataPoint.date, y: dataPoint.subscribers_count })
        dataset.datasets[2].data.push({ x: dataPoint.date, y: dataPoint.forks })
    }
    
    //This is the data for the overview bar.
    dataset.currentData = {
        stars: dataset.datasets[0].data[dataset.datasets[0].data.length-1].y,
        watchers: dataset.datasets[1].data[dataset.datasets[1].data.length-1].y,
        forks: dataset.datasets[2].data[dataset.datasets[2].data.length-1].y
    }

    //The chart style functions will be imported before this function is called.
    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    chartStyle.options.scales.yAxes[1].ticks.fixedStepSize = 1
    chartStyle.options.scales.yAxes[2].ticks.suggestedMin = 52

    callback(addChartStyle(dataset), chartStyle)
}
````

The dataset object is primarily used to generate charts. This object is directly passed to the `data` field of a chart.js chart object. Details on this object and its initialization parameters can be found in the [charts.js documentation](http://www.chartjs.org/docs/). The `addChartStyle` function sets the necessary options within the dataset so the chart's colors match the dashboard's theme.

The `chartStyle` object passed to the callback becomes the new chart object's options field. This allows for fine control over the chart style. See the [charts.js documentation](http://www.chartjs.org/docs/) for more information. A couple template styles are provided for common graph layouts. These are called `defaultChartOptions` and `twoAxisLineChart` which are meant for single y axis and dual y axis charts respectively. You can adjust copies of these defaults to better suit the needs of your chart, but be sure to make a deep copy first to prevent your changes from affecting other charts.

Aside from generating a chart, most dashboard elements have indicators of the metric's current status. This data is contained within a `dataset.currentData` object. A "live" indicator will be created for all attributes in this sub-object. This can be used to provide a non-intrusive key for a chart, or a status summary.

To create a new parser you need to first place your parsing function in a file, whose name is based on the parser's corresponding endpoint, in the `public/js/parsers/` directory. For example for your `github.js` data endpoint the parser should be found at `public/js/parsers/github-parser.js`. Make sure you load your parser in the `index.html` file and update the `dataParsers` object in the `public/js/main.js` file. You will need to create a new attribute in the `dataParsers` object whose name matches the data endpoint you wish to parse data from and whose value is your parser.

If you reload the page you should see your new shiney metric tracker hard at work! If not check your browser's console for errors indicating unfound parsers. This could be the result of a typo or unimported data parser. Keep in mind by default endpoints will update every fifteen minutes, so until then your metric tracker may have no data to show.
