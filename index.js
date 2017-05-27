//
// Metric Logger
//
// Scrapes various data sources and visualizes
// collected data in a web ui.

const process = require("process")
const nodemailer = require("nodemailer")
const beautify = require("js-beautify")
const moment = require("moment")
const fs = require("fs")
const Path = require("path")

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

// Load the data endpoints
const apiEndpoints = ["github.js", "explorer.js", "forum.js", "blog.js", "slackin.js", "website.js", "twitter.js"]//, "reddit.js"]
const data = require("./datalogger.js").init(apiEndpoints)

// Email setup
const getCustodian = (() => {
    let emailAssignments = {
        "default": {
            "primary": {
                "email": process.env.EMAIL_USER,
                "name": "siametrics"
            },
            "secondary": {
                "email": process.env.EMAIL_USER,
            },
            "all": {
                "email": process.env.EMAIL_USER
            }
        }
    }

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
    return (service, level) => {
        const fallback = emailAssignments["default"]
        const assignment = emailAssignments[service] || fallback
        switch (level){
            case 3:
                return assignment.tertiary || fallback.all
            case 2:
                return assignment.secondary || fallback.secondary
            default:
                return assignment.primary || fallback.primary
        }
    }
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

function emailErrors() {
    if (process.env.EMAIL_USER !== undefined) {
        try {
            let emailRecipients = [process.env.EMAIL_USER]
            let shouldSendEmail = false
            let servicesDown = []
            let message = ""

            for (const serviceName in data.dataEndpoints) {
                // service will be undefined if there is no data (server just started).
                const lastStatus = data.dataEndpoints[serviceName].checkStatus()
                const properName = serviceName.replace(".js", "").toUpperCase()

                // Update status block.
                message += `${properName}\n` +
                    `    STATUS:\t${lastStatus.status}\n` +
                    `    TIME:\t\t${moment(lastStatus.lastChanged, "YYYY-MM-DDTHH:mm:ss.SSZ").fromNow()}\n` +
                    `    REASON:\t${lastStatus.message}\n\n`

                if (lastStatus.reportLevel > 0) {
                    shouldSendEmail = true

                    // Service is down.
                    servicesDown.push(properName)

                    // Merge email lists.
                    let custodians = getCustodian(serviceName, lastStatus.reportLevel).email
                    if (typeof (custodians) !== typeof ([])) {
                        custodians = [custodians]
                    }

                    for (const index in custodians) {
                        if (!emailRecipients.includes(custodians[index])) {
                            emailRecipients.push(custodians[index])
                        }
                    }
                }
            }

            if (shouldSendEmail) {
                console.log(`Service${servicesDown.length > 1 ? "s" : ""} down, sending email: ${servicesDown.join(" ")}`)

                message = `The following service${servicesDown.length > 1 ? "s have" : " has"} reported new issues: ${servicesDown.join(" ")}\n` +
                    `The current status of all services are as follows:\n` +
                    `\n` + message + `\n` +
                    `The latest update for all services has been attached for debugging purposes.\n\n` +
                    `Some words of encouragement,\n\n${getQuote()}\n\n`

                const subject = `Sia-Metrics Issues With: ${servicesDown.join(" ")}`

                transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: emailRecipients,
                    subject: subject,
                    text: message,
                    attachments: [
                        { filename: `siaMetrics-${Math.round((new Date()) / 1000)}.json`, content: beautify(JSON.stringify(data.latest(1))) }
                    ]
                })
                .then(console.log(`Sent email to: ${emailRecipients.join(" ")}`))
                .catch((e) => console.log(`ERROR: Failed to send email: ${e}`))
            }
        } catch (e) {
            console.log(`ERROR Checking for email errors: ${e} on line ${e.stack}`)
        }
    } else {
        console.log(`WARN No email user providied, skipping email.`)
    }
}
setInterval(emailErrors,defaultUpdateTime)


// Data updating.
const updateData = (count) => {
    // Queries all modules for their latest data and updates
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
    const fileName = count
    fs.writeFileSync(`public/data-${fileName}.js`, `function wrapper(callback){ callback(${JSON.stringify(latestResponse)}) }`)   
}

// Rebuilds the data all file.
const rebuildAll = () => {
    fs.writeFileSync("public/data-all.js", "function wrapper(callback) { callback({")
    const dataEndpointKeys = Object.keys(data.dataEndpoints)
    const buildEntry = () => {
        if (dataEndpointKeys.length) {
            const outputStream = fs.createWriteStream("public/data-all.js", { flags: "a+", autoClose: false })
            const key = dataEndpointKeys.shift()
            outputStream.write(`"${key}": [`)
            const inputStream = fs.createReadStream(Path.join(__dirname, "logs", key + "on"))
            const ended = () => {
                console.log(`\tindex.js\t${Math.floor(Number(new Date()) / 1000)}: data-all.js appended ${key}`)
                outputStream.on("finish", () => setTimeout(() => buildEntry(), 0))
                outputStream.end(`{ "skip": true, "custodian": "${ getCustodian(key).name }" } ],`)
            }
            inputStream.on("end", ended)
            inputStream.on("error", e => { console.log("ERROR " + e); ended() })
            outputStream.on("error", e => { console.log("ERROR " + e); ended() })
            inputStream.pipe(outputStream)
        } else {
            const outputStream = fs.createWriteStream("public/data-all.js", { flags: "a+" })
            outputStream.end("}) }")
        }
    }
    buildEntry()
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
console.log("-- Creating 3000 entry log... (1 month)")
updateData(3000)
console.log("-- Creating 700 entry log... (1 week)")
updateData(700)
console.log("-- Creating 200 entry log... (2 days)")
updateData(200)
console.log("-- Creating all entry log... (everything)")
rebuildAll()

setInterval(() => updateData(3000), defaultUpdateTime)
setInterval(() => updateData(700), defaultUpdateTime)
setInterval(() => updateData(200), defaultUpdateTime)
setInterval(() => rebuildAll(), defaultUpdateTime*4)

console.log("-- Logging new data...")
data.startLogging()
