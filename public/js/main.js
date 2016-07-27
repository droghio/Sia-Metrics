//
// Main Chart Rendering
//
// Pulls latest data from the server and generates charts based on data.
//

const dataParsers = {
    "github.js": (chartName, chartData, callback) => {
        //We are collecting three metrics:
        //    Stars
        //    Forks
        //    Subscribers

        let dataset = {
            datasets: [
                { label: "stars", data: [], yAxisID: "1" },
                { label: "watches", data: [], yAxisID: "2" },
                { label: "forks", data: [], yAxisID: "2"}
            ],
            labels: []
        }

        //This is the data for the chart.
        for (let dataPoint of chartData){
            dataset.datasets[0].data.push(dataPoint.stargazers_count)
            dataset.datasets[1].data.push(dataPoint.subscribers_count)
            dataset.datasets[2].data.push(dataPoint.forks)
            dataset.labels.push( moment(dataPoint.date).format("MMM D h:m:ss A") )
        }
        
        //This is the data for the overview bar.
        dataset.currentData = {
            stars: dataset.datasets[0].data[dataset.datasets[0].data.length-1],
            watchers: dataset.datasets[1].data[dataset.datasets[1].data.length-1],
            forks: dataset.datasets[2].data[dataset.datasets[2].data.length-1]
        }

        let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
        chartStyle.options.scales.yAxes[1].ticks.fixedStepSize = 1
        chartStyle.options.scales.yAxes[2].ticks.suggestedMin = 50

        callback(addChartStyle(dataset), chartStyle)
    },

    "explorer.js": (chartName, chartData, callback) => {
        //We are collecting four metrics:
        //    Difficulty
        //    Hash Rate
        //    Block Height
        //    Total Coins

        let dataset = {
            datasets: [
                { label: "difficulty", data: [], yAxisID: "1" },
                { label: "hash rate", data: [], yAxisID: "1" },
                { label: "block height", data: [], yAxisID: "2"}
            ],
            labels: []
        }

        //This is the data for the chart.
        for (let dataPoint of chartData){
            dataset.datasets[0].data.push( (new BigNumber(dataPoint.difficulty)).times("1e-12").toNumber() )
            dataset.datasets[1].data.push( (new BigNumber(dataPoint.estimatedhashrate)).times("1e-9").toNumber()  )
            dataset.datasets[2].data.push( dataPoint.height )
            dataset.labels.push( moment(dataPoint.date).format("MMM D h:m:ss A") )
        }
        
        //This is the data for the overview bar.
        let latestData = chartData[chartData.length-1]
        dataset.currentData = {
            "difficulty (TH)": (new BigNumber(latestData.difficulty)).times("1e-12").toFixed(0),
            "hash rate (GH/s)": (new BigNumber(latestData.estimatedhashrate)).times("1e-9").toFixed(0),
            "block height": latestData.height,
            "total siacoins (MS)": (new BigNumber(latestData.totalcoins)).times("1e-30").toFixed(0)
        }

        let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
        chartStyle.options.scales.yAxes[1].ticks.fixedStepSize = 2000
        chartStyle.options.scales.yAxes[2].ticks.fixedStepSize = 1000

        callback(addChartStyle(dataset), chartStyle)
    },

    "forum.js": (chartName, chartData, callback) => {
        //We are collecting one metric:
        //    Online

        let dataset = {
            datasets: [
                { label: "online", data: [] },
            ],
            labels: []
        }

        //This is the data for the chart.
        for (let dataPoint of chartData){
            dataset.datasets[0].data.push( dataPoint.online )
            dataset.labels.push( moment(dataPoint.date).format("MMM D h:m:ss A") )
        }
        
        //This is the data for the overview bar.
        let latestData = chartData[chartData.length-1]
        dataset.currentData = {
            "is online": latestData.online,
        }

        let chartStyle = JSON.parse(JSON.stringify(defaultChartOptions))
        callback(addChartStyle(dataset), chartStyle)
    }
}


//
// Chart Style Options
//
//

const defaultChartOptions =  {
    type: "line",
    options: {
        legend: {
            display: false
        }
    }
}

const twoAxisLineChart = {
    type: "line",
    options: {
        legend: {
            display: false,
        },
        scales: {
            yAxes: [{
                type: "linear",
                stacked: true
            },{
                ticks: {},
                id: "1"
            },{
                ticks: {},
                id: "2"
            }]
        }
    }
}


const addChartStyle = (dataset) => {
    const colors = [
        "#19B3FE",
        "#D14634",
        "#00CBA0",
        "#285165",
        "#FE1932",
        "#0000FF",
        "#FF0000",
        "#FFFF00",
        "#00FF00",
    ]

    for (let idx in dataset.datasets){
        dataset.datasets[idx].backgroundColor = colors[idx]
        dataset.datasets[idx].borderColor = colors[idx]
        dataset.datasets[idx].fill = false
    }

    return dataset
}


//
// UI Render Call
//
//

wrapper((data) => {
    const chartContainer = document.getElementById("chart-container")
    for (let chartName in data){
        if (dataParsers[chartName]){
            dataParsers[chartName](chartName, data[chartName], (dataset, chartOptions) => {
                chartName = chartName.replace(".js", "")
    
                //Generate metric panel.
                let currentMetrics = ""
                for (let dataSetName in dataset.currentData){
                    currentMetrics += `
                        <div class="current-metric">
                            <h2>${dataSetName}</h2>
                            <span>${dataset.currentData[dataSetName]}</span>
                        </div>
                    `
                }
    
                //Generate containing div.
                let chartTemplate = `
                    <section id="${chartName}" class="chart">
                        <header>
                            ${chartName}
                        </header>
                        <canvas id="${chartName}-chart"></canvas>
                        <div id="${chartName}-metrics">
                            ${currentMetrics}
                        </div>
                    </section>
                `
                let parser = new DOMParser()
                let doc = parser.parseFromString(chartTemplate, "text/html")
                chartContainer.appendChild(doc.getElementById(chartName))
    
                const ctx = document.getElementById(chartName+"-chart").getContext("2d")
                let myLineChart = new Chart(ctx, {
                    type: chartOptions.type || defaultChartOptions.type,
                    data: dataset,
                    options: chartOptions.options || defaultChartOptions.options
               })
           })
        } else {
            console.log(`ERROR: Could not find parser for endpoint: ${chartName} ignoring`)
        }
    }
}) 
