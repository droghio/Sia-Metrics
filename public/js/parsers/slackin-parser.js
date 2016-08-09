//
// Slackin UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const slackinParser = (chartName, chartData, callback) => {
    //We are collecting one metric:
    //    Online

    let dataset = {
        datasets: [
            { label: "active users", data: [], yAxisID: "1" },
            { label: "total users", data: [], yAxisID: "2" },
            { label: "online", data: [], yAxisID: "3" },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let date = moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ")
        dataset.datasets[0].data.push({ x: date, y: dataPoint.active })
        dataset.datasets[1].data.push({ x: date, y: dataPoint.total })
        dataset.datasets[2].data.push({ x: date, y: dataPoint.statusCode < 400 || dataPoint.statusCode > 599 })
    }
    
    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    dataset.currentData = {
        "active users": latestData.active,
        "total users": latestData.total,
        "is online": latestData.statusCode < 400 || latestData.statusCode > 599,
    }

    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    chartStyle.options.scales.yAxes.push({ ticks: { min: 0, max: 1}, id: "3" })

    callback(addChartStyle(dataset), chartStyle)
}
