//
// Main Chart Rendering
//
// Pulls latest data from the server and generates charts based on data.
//

const dataParsers = {
    "github.js": (chartName, chartData, callback) => {
        //We are collecting three metrics:
        //    Stars
        //    Forks
        //    Subscribers

        let dataset = {
            datasets: [
                { label: "stars", data: [] },
                { label: "watches", data: [] },
                { label: "forks", data: [] }
            ],
            labels: []
        }

        for (let dataPoint of chartData){
            dataset.datasets[0].data.push(dataPoint.stargazers_count)
            dataset.datasets[1].data.push(dataPoint.subscribers_count)
            dataset.datasets[2].data.push(dataPoint.forks)
            dataset.labels.push(dataPoint.date)
        }
        
        dataset.currentData = {
            stars: dataset.datasets[0].data[dataset.datasets[0].data.length-1],
            watchers: dataset.datasets[1].data[dataset.datasets[1].data.length-1],
            forks: dataset.datasets[2].data[dataset.datasets[2].data.length-1]
        }

        callback(dataset) 
    },
}

wrapper((data) => {
    const chartContainer = document.getElementById("chart-container")
    for (let chartName in data){
        dataParsers[chartName](chartName, data[chartName], (dataset) => {
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
                    <canvas id="${chartName}-chart"></canvas>
                    <div id="${chartName}-metrics">
                        ${currentMetrics}
                    </div>
                    <header>
                        ${chartName}
                    </header>
                </section>
            `
            let parser = new DOMParser()
            let doc = parser.parseFromString(chartTemplate, "text/html")
            chartContainer.appendChild(doc.getElementById(chartName))

            const ctx = document.getElementById(chartName+"-chart").getContext("2d")
            let myLineChart = new Chart(ctx, {
                type: 'line',
                data: dataset
            })
        })
    }
})
