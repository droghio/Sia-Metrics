//
// Chart Style Options
//
//

const defaultChartOptions =  {
    type: "line",
    options: {
        legend: {
            display: false
        },
        scales: {
            xAxes: [{
                type: "time"
            }],
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
            xAxes: [{
                type: "time"
            }],
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
