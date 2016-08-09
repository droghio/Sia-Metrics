//
// Github UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const githubParser = (chartName, chartData, callback) => {
    //We are collecting three metrics:
    //    Stars
    //    Forks
    //    Subscribers

    let dataset = {
        datasets: [
            { label: "stars", data: [], yAxisID: "1" },
            { label: "watches", data: [], yAxisID: "2" },
            { label: "forks", data: [], yAxisID: "2"},
            { label: "online", data: [], yAxisID: "3" },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let date = moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ")
        dataset.datasets[0].data.push({ x: date, y: dataPoint.stargazers_count })
        dataset.datasets[1].data.push({ x: date, y: dataPoint.subscribers_count })
        dataset.datasets[2].data.push({ x: date, y: dataPoint.forks })
        dataset.datasets[3].data.push({ x: date, y: dataPoint.statusCode < 400 || dataPoint.statusCode  })
    }
    
    //This is the data for the overview bar.
    dataset.currentData = {
        stars: dataset.datasets[0].data[dataset.datasets[0].data.length-1].y,
        watchers: dataset.datasets[1].data[dataset.datasets[1].data.length-1].y,
        forks: dataset.datasets[2].data[dataset.datasets[2].data.length-1].y,
        "is online": dataset.datasets[3].data[dataset.datasets[3].data.length-1].y,
    }

    //The chart style functions will be imported before this function is called.
    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    chartStyle.options.scales.yAxes[1].ticks.fixedStepSize = 1
    chartStyle.options.scales.yAxes[2].ticks.suggestedMin = 52
    chartStyle.options.scales.yAxes.push({ ticks: { suggestedMin: 0, suggestedMax: 1}, id: "3" })

    callback(addChartStyle(dataset), chartStyle)
}
