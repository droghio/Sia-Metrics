//
// Reddit UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const redditParser = (chartName, chartData, callback) => {
    //We are collecting one metric:
    //    Posts in past 72 hours

    const devUserNames = [ "droghio", "Taek42", "sia_nemo"]
    let dataset = {
        datasets: [
            { label: "posts (past 72 hours)", data: [], yAxisID: "1" },
            { label: "dev posts (past 72 hours)", data: [], yAxisID: "2" },
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let isThreeDaysOld = undefined
        if (dataPoint.data !== undefined){
            isThreeDaysOld = dataPoint.data.children.reduce((p, c) =>
                moment(c.data.created_utc*1000).isAfter(moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ").subtract(3, 'days')) ? p+1 : p, 0)
            isThreeDaysOldDev = dataPoint.data.children.reduce((p, c) =>
                moment(c.data.created_utc*1000).isAfter(moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ").subtract(3, 'days')) &&
                devUserNames.includes(c.data.author) ? p+1 : p, 0)}
        dataset.datasets[0].data.push({
            x: moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ"),
            y: isThreeDaysOld
        })
        dataset.datasets[1].data.push({
            x: moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ"),
            y: isThreeDaysOldDev
        })
    }

    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    let postsLastThreeDays = undefined
    let postsThreeDaysDevs = undefined
    if (latestData.data){
        postsLastThreeDays = latestData.data.children.reduce((p, c) => 
            moment(c.data.created_utc*1000).isAfter(moment().subtract(3, 'days')) ? p+1 : p, 0)
        postsThreeDaysDevs = latestData.data.children.reduce((p, c) => 
            moment(c.data.created_utc*1000).isAfter(moment().subtract(3, 'days')) &&
            devUserNames.includes(c.data.author) ? p+1 : p, 0)
    }
    dataset.currentData = {
        "posts (past 72 hours)": postsLastThreeDays,
        "dev posts (past 72 hours)": postsThreeDaysDevs
    }

    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    callback(addChartStyle(dataset), chartStyle)
}
