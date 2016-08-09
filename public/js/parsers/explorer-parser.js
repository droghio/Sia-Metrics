//
// Explorer UI Data Parser
//
// Parses log data provided to UI frontent into content that can be rendered.
//

const explorerParser = (chartName, chartData, callback) => {
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
        ]
    }

    //This is the data for the chart.
    for (let dataPoint of chartData){
        let date = moment(dataPoint.date, "YYYY-MM-DDTHH:mm:ss.SSZ")
        dataset.datasets[0].data.push({ x: date, y: (new BigNumber(dataPoint.difficulty)).times("1e-12").toNumber() })
        dataset.datasets[1].data.push({ x: date, y: (new BigNumber(dataPoint.estimatedhashrate)).times("1e-9").toNumber() })
        dataset.datasets[2].data.push({ x: date, y: dataPoint.height })
    }
    
    //This is the data for the overview bar.
    const latestData = chartData[chartData.length-1] || {}
    dataset.currentData = {
        "difficulty (TH)": (new BigNumber(latestData.difficulty)).times("1e-12").toFixed(0),
        "hash rate (GH/s)": (new BigNumber(latestData.estimatedhashrate)).times("1e-9").toFixed(0),
        "block height": latestData.height,
        "total siacoins (MS)": (new BigNumber(latestData.totalcoins)).times("1e-30").toFixed(0)
    }

    let chartStyle = JSON.parse(JSON.stringify(twoAxisLineChart))
    chartStyle.options.scales.yAxes[1].ticks.fixedStepSize = 2000
    chartStyle.options.scales.yAxes[1].ticks.suggestedMax = 20000
    chartStyle.options.scales.yAxes[1].ticks.suggestedMin = 4000
    chartStyle.options.scales.yAxes[2].ticks.fixedStepSize = 1000
    chartStyle.options.scales.yAxes[2].ticks.min = 63000
    chartStyle.options.scales.yAxes[2].ticks.suggestedMax = 67000

    callback(addChartStyle(dataset), chartStyle)
}
