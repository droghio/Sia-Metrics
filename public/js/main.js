//
// Main Chart Rendering
//
// Pulls latest data from the server and generates charts based on data.
//

// These functions are passed the arrays containing the raw logging data.
// They must filter the data and return a dataset object and current statistics
// that are used to generate the UI. Be sure to include the parser file in
// index.html before attempting to use it.
//
// The parser uses the logging modules name, ie "github.js" to load the
// correct parser.
const dataParsers = {
    "github.js": githubParser,
    "explorer.js": explorerParser,
    "forum.js": forumParser,
    "blog.js": onlineParser, 
    "website.js": onlineParser, 
    "slackin.js": slackinParser,
    "twitter.js": twitterParser,
    "reddit.js": redditParser,
}


//
// UI Render Call
//
//

wrapper = undefined
const dataTag=document.createElement('script');

let dataUrl = ""
switch (window.location.search){
    case "?span=all":
        dataUrl = "data-all"
        break
    case "?span=3000":
        dataUrl = "data-3000"
        break;
    case "?span=700":
        dataUrl = "data-700"
        break;
    default:
        dataUrl = "data-200"
        break
}
dataTag.src=`/${dataUrl}.js`;
document.body.appendChild(dataTag);

const waitForWrapper = () => {
    if (wrapper){
        wrapper((data) => {
            const chartContainer = document.getElementById("chart-container")
            let count = 0;
            for (let chartname in data){
                if (dataParsers[chartname]){
                    let genFunction = (chartName, count) => () => {
                        try {
                            let custodian
                            if (data[chartName][data[chartName].length-1].skip === true){
                                custodian = data[chartName].splice(-1, 1)[0].custodian
                            }
                            return dataParsers[chartName](chartName, data[chartName], (dataset, chartOptions) => {
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
                                        <footer>
                                            ${ custodian || data[chartName+".js"][data[chartName+".js"].length-1].custodian || "data unavailable" }
                                        </footer>
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

                                // If chart is done loading show the ui.
                                if (count === Object.keys(data).length-1){
                                    document.getElementsByTagName("body")[0].classList.remove("loading")
                                    document.getElementsByTagName("body")[0].classList.add(dataUrl)
                                }
                            })
                        } catch (e) {
                            console.log(`ERROR: Unable to load chart for "${chartName}", ${e} on line ${e.lineNumber}`)
                            // If chart is done loading show the ui.
                            if(count === Object.keys(data).length-1) {
                                document.getElementsByTagName("body")[0].classList.remove("loading")
                                document.getElementsByTagName("body")[0].classList.add(dataUrl)
                            }
                        }
                    }

                    setTimeout(genFunction(chartname, count), count*100)
                    count++
                } else {
                    console.log(`ERROR: Could not find parser for endpoint: ${chartName} ignoring`)
                }
            }
        
            document.getElementsByTagName("footer")[0].innerHTML = moment(new Date()).format("MMMM Do YYYY, h:mm a")
        
            // Automatically reload page after fifteen minutes to reflect newest info.
            setTimeout(() => window.location.reload(), 15*60*1000)
        }) 
    } else {
        // Wait until we have loaded the data.
        setTimeout(waitForWrapper, 50)
    }
}
waitForWrapper()
