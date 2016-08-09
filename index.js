//
// Metric Logger
//
// Scrapes various data sources and visualizes
// collected data in a web ui.

const apiEndpoints = ["github.js", "explorer.js", "forum.js", "blog.js", "slackin.js", "website.js", "twitter.js", "reddit.js"]
const data = require("./datalogger.js").init(apiEndpoints)
const express = require("express")
const app = express()
const process = require("process")
const nodemailer = require("nodemailer")
const beautify = require("js-beautify")

const PORT = process.env.SIA_METRIC_PORT || 8080

//Serves static files.
app.use(express.static("public"))
app.use("/charts/", express.static("node_modules/chart.js/dist/"))
app.use("/js/moment.js", express.static("node_modules/moment/moment.js"))
app.use("/js/bignumber.js", express.static("node_modules/bignumber.js/bignumber.js"))

//Data endpoint.
let serverResponse = ""
app.get("/data", (req, res) => {
    if (req.query.callback){
        res.send(`function ${req.query.callback}(callback){
            callback(${serverResponse})
        }`)
    } else {
        res.send(serverResponse)
    }
})

app.listen(PORT, () =>
    console.log(`Running server on port ${PORT}`)
)

data.startLogging()

const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWD
    }
}
const transporter = nodemailer.createTransport(smtpConfig)

let pendingErrors = {}
function emailErrors() {
    let servicesDown = []
    let shouldSendEmail = false
    let latestData = data.latest(1)
    for (let serviceName in latestData){
        let service = latestData[serviceName][0]
        if (!(service.statusCode < 400 || service.statusCode > 599)){
            // Service is down.
            servicesDown.push(serviceName.replace(".js", "").toUpperCase())
            if (pendingErrors[serviceName] == null || (pendingErrors[serviceName] && (new Date() - pendingErrors[serviceName].lastSent) > 24*60*60*1000)){
                // If it has been down for 24 hours since our last email send one again.
                shouldSendEmail = true
            }
        } else {
            pendingErrors[serviceName] = null
        }
    }

    if (shouldSendEmail){
        console.log(`Service${ servicesDown.length > 1 ? "s" : "" } down, sending email: ${beautify(JSON.stringify(latestData))}`)
        transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER,
            subject: `Sia-Metrics Service${ servicesDown.length > 1 ? "s" : "" } Down: ${servicesDown.join(" ")}`,
            text: `Service Status:\n${beautify(JSON.stringify(latestData))}`
        })
        .then(console.log("Sent email."))
        .catch((e) => console.log(`ERROR: Failed to send email: ${e}`))
    }
}
setInterval(emailErrors,31*1000)

serverResponse = JSON.stringify(data.latest(200))
setInterval( () => {
    // Queries all modules for their latest data and supdates
    // the response string of the module.
    serverResponse = JSON.stringify(data.latest(200))
}, 30*1000)
