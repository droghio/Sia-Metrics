//
// Metric Logger
//
// Scrapes various data sources and visualizes
// collected data in a web ui.

const apiEndpoints = ["github.js", "explorer.js", "forum.js", "blog.js", "slackin.js", "website.js", "twitter.js", "reddit.js"]
const data = require("./datalogger.js").init(apiEndpoints)
const process = require("process")
const nodemailer = require("nodemailer")
const beautify = require("js-beautify")
const fs = require("fs")

// Every 7.5 minutes. A little more to encourage the API to update data before we check for updates.
const defaultUpdateTime = 7.5025*60*1000

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
        // service will be undefined if there is no data (server just started).
        if (latestData[serviceName].length >= 1 && latestData[serviceName][0].statusCode){
            let service = latestData[serviceName][0]

            // Error checker takes in the latest data from each node and returns:
            //     Whether an email should be sent or not
            //     To whom an email should be sent
            //     Whether there is an issue or not (in the event another module triggers an email while we are waiting for a response)
            //     What the error is
            //     How long the error has occured

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
        } else {
            console.log(`WARNING: Could not check for errors, no status code data found for "${serviceName}": ${latestData[0]}`)
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
setInterval(emailErrors,defaultUpdateTime)


// Data updating.
const updateData = (count) => {
    // Queries all modules for their latest data and supdates
    // the response string of the module.
    count = count === undefined ? 200 : count
    console.log(`\tindex.js\t${Math.floor(Number(new Date())/1000)}: Refreshing Data: ${count}`)
    let latestResponse = data.latest(count)
    for (let serviceName in latestResponse){
        // Put the custodian information into the latest data point."
        if (latestResponse[serviceName].length){
            latestResponse[serviceName][latestResponse[serviceName].length-1].custodian = getCustodian(serviceName).name
        }
    }
    const fileName = count === 0 ? "all" : count
    fs.writeFileSync(`public/data-${fileName}.js`, `function wrapper(callback){ callback(${JSON.stringify(latestResponse)}) }`)
}


// Copying Dependencies for the UI.
console.log("--------------------------")
console.log("-- Copying Dependencies --")
console.log("--------------------------")
console.log("--")
console.log("-- Copying chart.js")
fs.writeFileSync("public/js/chart.js", fs.readFileSync("node_modules/chart.js/dist/Chart.min.js"))
console.log("-- Copying moment.js")
fs.writeFileSync("public/js/moment.js", fs.readFileSync("node_modules/moment/min/moment.min.js"))
console.log("-- Copying bignumber.js")
fs.writeFileSync("public/js/bignumber.js", fs.readFileSync("node_modules/bignumber.js/bignumber.min.js"))
console.log("--")

// Initialize Data Files.
console.log("-----------------------")
console.log("-- Initializing Data --")
console.log("-----------------------")
console.log("--")
console.log("-- Creating full entry log... (everything)")
updateData(0)
console.log("-- Creating 3000 entry log... (1 month)")
updateData(3000)
console.log("-- Creating 700 entry log... (1 week)")
updateData(700)
console.log("-- Creating 200 entry log... (2 days)")
updateData(200)

setInterval(updateData, defaultUpdateTime)
setInterval(() => updateData(700), defaultUpdateTime)
setInterval(() => updateData(3000), defaultUpdateTime)
setInterval(() => updateData(0), defaultUpdateTime*4) // Update every half hour

console.log("-- Logging new data...")
data.startLogging()
