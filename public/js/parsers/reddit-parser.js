//
// Reddit UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const redditParser = (chartName, chartData, callback) => {
    //We are collecting one metric:
    //    Posts in past 72 hours

    let dataset = {
        datasets: [
            { label: "posts (past 72 hours)", data: [] },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let isThreeDaysOld = undefined
        if (dataPoint.data !== undefined){
            isThreeDaysOld = dataPoint.data.children.reduce((p, c) =>
                moment(c.data.created_utc*1000).isAfter(moment(dataPoint.date).subtract(3, 'days')) ? p+1 : p, 0)
        }
        dataset.datasets[0].data.push({
            x: dataPoint.date,
            y: isThreeDaysOld
        })
    }

    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    let postsLastThreeDays = undefined
    if (latestData.data){
        postsLastThreeDays = latestData.data.children.reduce((p, c) => 
            moment(c.data.created_utc*1000).isAfter(moment().subtract(3, 'days')) ? p+1 : p, 0)
    }
    dataset.currentData = {
        "posts (past 72 hours)": postsLastThreeDays 
    }

    let chartStyle = JSON.parse(JSON.stringify(defaultChartOptions))
    callback(addChartStyle(dataset), chartStyle)
}
