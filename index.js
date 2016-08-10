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
const fs = require("fs")


// Serves static files.
app.use(require("helmet")())
app.use(require('compression')())
app.use(express.static("public"))
app.use("/charts/", express.static("node_modules/chart.js/dist/"))
app.use("/js/moment.js", express.static("node_modules/moment/moment.js"))
app.use("/js/bignumber.js", express.static("node_modules/bignumber.js/bignumber.js"))

// Data server.
let serverResponse = ""
app.get("/data", (req, res) => {
    res.setHeader("Content-Type", "application/javascript")
    if (req.query.callback){
        res.send(`function ${req.query.callback}(callback){
            callback(${serverResponse})
        }`)
    } else {
        res.send(serverResponse)
    }
})

const PORT = process.env.SIA_METRICS_PORT || 8080
app.listen(PORT, () => {
    console.log(`Running server on port ${PORT}`)

    // Setup initial data
    const updateData = () => {
        // Queries all modules for their latest data and supdates
        // the response string of the module.
        console.log(`\tindex.js\t${Math.floor(Number(new Date())/1000)}: Refreshing Data`)
        let latestResponse = data.latest(200)
        for (let serviceName in latestResponse){
            // Put the custodian information into the latest data point."
            if (latestResponse[serviceName].length){
                latestResponse[serviceName][latestResponse[serviceName].length-1].custodian = getCustodian(serviceName).name
            }
        }
        serverResponse = JSON.stringify(latestResponse)
    }
    updateData()
    setInterval(updateData, 7.5025*60*1000)

    data.startLogging()
})

// Quote of the day.
getQuote = (() => {
    const quotes = fs.readFileSync("fortunes").toString().split(`\n%\n`)
    return () => quotes[ Math.floor( Math.random() * quotes.length ) ]
})()
console.log("---------------------")
console.log("---- Sia Metrics ----")
console.log("---------------------")
console.log("--") 
console.log("-- Starting...")
console.log("--")

console.log("----------------------")
console.log("-- Quote of the Day --")
console.log("----------------------")
console.log("--\t"+getQuote().replace(/\n/g, "\n--\t"))
console.log("--")


// Email setup
const getCustodian = (() => {
    let emailAssignments = { default: { email: process.env.EMAIL_USER, name: "siametrics"} }
    try {
        emailAssignments = JSON.parse(fs.readFileSync("assignments.json"))
        console.log("------------------------------")
        console.log("-- Loaded email assignments --")
        console.log("------------------------------")
        console.log(`--\t${beautify(JSON.stringify(emailAssignments)).replace(/\n/g, "\n\--\t")}`)
        console.log("--")
    } catch (e) {
        console.log(`ERROR: While decoding assignments.json: ${e}\n`)
    }
    return (service) =>
        emailAssignments[service] || emailAssignments["default"]
})()

if (process.env.EMAIL_USER === undefined){
    console.log("")
    console.log("ERROR: No email username found, did you remember to define the EMAIL_USER enviornment variable?")
    console.log("")
}

if (process.env.EMAIL_PASSWD === undefined){
    console.log("")
    console.log("ERROR: No email password found, did you remember to define the EMAIL_PASSWD enviornment variable?")
    console.log("")
}

const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWD
    }
}
const transporter = nodemailer.createTransport(smtpConfig)

let pendingErrors = {}
function emailErrors() {
    let servicesDown = []
    let emailRecipients = [process.env.EMAIL_USER]
    let shouldSendEmail = false
    let downForMoreThanADay = false
    let latestData = data.latest(1)

    for (let serviceName in latestData){
        let service = latestData[serviceName][0]
        if (!(service.statusCode < 400 || service.statusCode > 599)){

            // Service is down.
            servicesDown.push(serviceName.replace(".js", "").toUpperCase())
            if (!emailRecipients.includes(getCustodian(serviceName).email)){
                emailRecipients.push(getCustodian(serviceName).email)
            }

            // Only send email if service just went down, or has been down for more than 24 hours straight.
            if (pendingErrors[serviceName] == null){
                shouldSendEmail = true
                pendingErrors[serviceName] = new Date()
            } else if (pendingErrors[serviceName] && (new Date() - pendingErrors[serviceName]) > 24*60*60*1000) {
                // If the service has been down for more than 24 hours alert the entire team.
                shouldSendEmail = true
                pendingErrors[serviceName] = new Date()
                downForMoreThanADay = true
                emailRecipients = getCustodian("all") // Returns array of all emails. Other modules can only add to this list.
            }
        } else {
            pendingErrors[serviceName] = null
        }
    }

    if (shouldSendEmail){
        console.log(`Service${ servicesDown.length > 1 ? "s" : "" } down, sending email: ${servicesDown.join(" ")}`)
        if (downForMoreThanADay){
            console.log("WARNING: At least one service has down for more than a day; emailing all developers.")
        }

        const message = downForMoreThanADay ?
            `The following service${ servicesDown.length > 1 ? "s have" : " has" } gone offline: ${servicesDown.join(" ")}\n\n`+
                `At least one of which has been down for over a day. The lastest data from all endpoints has been included for debugging purposes.\n`+
                `A very unfortunate situation detected,`+
                ` deploying high-priority comic relief counter-measures...\n\n${getQuote()}\n\n` :

            `The following service${ servicesDown.length > 1 ? "s have" : " has" } gone offline: ${servicesDown.join(" ")}\n\n`+
                `The lastest data from all endpoints has been included for debugging purposes.\nUnfortunate situation detected,`+
                ` deploying comic relief counter-measures...\n\n${getQuote()}\n\n`
 
        const subject = downForMoreThanADay ?
            `Sia-Metrics Service${ servicesDown.length > 1 ? "s" : "" } Down For Over A Day: ${servicesDown.join(" ")}` :
            `Sia-Metrics Service${ servicesDown.length > 1 ? "s" : "" } Down: ${servicesDown.join(" ")}`

        transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emailRecipients,
            subject: subject,
            text: message,
            attachments: [
                { filename: `siaMetrics-${Math.round((new Date())/1000)}.json`, content: beautify(JSON.stringify(latestData)) }
            ]
        })
        .then(console.log(`Sent email to: ${emailRecipients.join(" ")}`))
        .catch((e) => console.log(`ERROR: Failed to send email: ${e}`))
    } else {
        if (servicesDown.length){
            console.log(`Service${ servicesDown.length > 1 ? "s" : "" } down, waiting: ${servicesDown.join(" ")}`)
        }
    }
}
setInterval(emailErrors,7.5025*60*1000)
