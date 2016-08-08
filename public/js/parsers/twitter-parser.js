//
// Twitter UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const twitterParser = (chartName, chartData, callback) => {
    //We are collecting one metric:
    //    Online

    let dataset = {
        datasets: [
            { label: "followers", data: [], yAxisID: "1" },
            { label: "statuses", data: [], yAxisID: "2" },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        dataset.datasets[0].data.push({ x: dataPoint.date, y: dataPoint.followers_count })
        dataset.datasets[1].data.push({ x: dataPoint.date, y: dataPoint.statuses_count })
    }
    
    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    dataset.currentData = {
        "followers": latestData.followers_count,
        "statuses": latestData.statuses_count,
        "last post date": moment(latestData.status.created_at).fromNow(),
    }

    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    callback(addChartStyle(dataset), chartStyle)
}
