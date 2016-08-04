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
            { label: "online", data: [] },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        dataset.datasets[0].data.push({ x: dataPoint.date, y: dataPoint.statusCode < 500 || dataPoint.statusCode > 599 })
    }
    
    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    dataset.currentData = {
        "is online": latestData.statusCode < 500 || latestData.statusCode > 599,
    }

    let chartStyle = JSON.parse(JSON.stringify(defaultChartOptions))
    callback(addChartStyle(dataset), chartStyle)
}
