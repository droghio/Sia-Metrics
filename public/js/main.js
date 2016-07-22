//
// Main Chart Rendering
//
// Pulls latest data from the server and generates charts based on data.
//


const defaultChartOptions =  {
    type: "line",
    options: {
        legend: {
            display: false
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

        callback(addChartStyle(dataset), {
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
                        ticks: {
                            fixedStepSize: 1
                        },
                        id: "1"
                    },{
                        ticks: {
                            suggestedMin: 50
                        },
                        id: "2"
                    }]
                }
            }
        })
    }
}

wrapper((data) => {
    const chartContainer = document.getElementById("chart-container")
    for (let chartName in data){
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
    }
})
