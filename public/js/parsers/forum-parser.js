//
// Forum UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const forumParser = (chartName, chartData, callback) => {
    //We are collecting one metric:
    //    Online

    let dataset = {
        datasets: [
            { label: "posts", data: [], yAxisID: "1" },
            { label: "online", data: [], yAxisID: "2" },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let date = moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ")
        dataset.datasets[0].data.push({ x: date, y: dataPoint.posts })
        dataset.datasets[1].data.push({ x: date, y: dataPoint.statusCode < 400 || dataPoint.statusCode > 599 })
    }
    
    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    dataset.currentData = {
        "total posts": latestData.posts,
        "is online": latestData.statusCode < 400 || latestData.statusCode > 599,
    }

    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    chartStyle.options.scales.yAxes[2].ticks.suggestedMin = 0
    chartStyle.options.scales.yAxes[2].ticks.suggestedMax = 1
    callback(addChartStyle(dataset), chartStyle)
}
