"use strict"

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

require("dotenv").config()
// Core Modules
let path = require("path")

// Dependencies
let express = require("express")
let favicon = require("serve-favicon")
let bodyParser = require("body-parser")
let cors = require("cors")
let helmet = require("helmet")

// Utils
let conf = require("./utils/configHandler")
let log = require("./utils/logger")
let meta = require("./utils/meta")

// Services
let portHandler = require("./services/portCheck")
let rootHandler = require("./services/rootHandler")
let RateLimiter = require("./services/rateLimiter")
let getRoutes = require("./services/getRoutes")

// Endpoints
let v1 = require("./routes/routerV1")
let v2 = require("./routes/routerV2")

let robotsHandler = require("./services/robotsHandler")
let err404Handler = require("./services/err404Handler")

let version = conf.getVersion()
let appname = conf.getName()
let devname = conf.getAuthor()

let mongoose = require("mongoose")

let splashPadding = 12 + appname.length + version.toString().length

console.log(
    "\n" +
    ` #${"-".repeat(splashPadding)}#\n` +
    ` # Started ${appname} v${version} #\n` +
    ` #${"-".repeat(splashPadding)}#\n\n` +
    ` Copyright (c) ${(new Date()).getFullYear()} ${devname}\n`
)

let app = express()

log.done("Started.")

meta((data) => {
    log.info(`Environment: ${data.environment}`)
    log.info(`NodeJS Version: ${data.nodeversion}`)
    log.info(`Operating System: ${data.os}`)
    log.info(`Server IP: ${data.ip}`)
})

let config = conf.getConfig()

// MongoDB
const MONGODB_URL = process.env.MONGODB_URL

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
var db = mongoose.connection

if(!db)
    log.info("Error connecting db")
else
    log.info("MongoDB "+ process.env.MONGODB_NAME +" connected successfully")
// End MongoDB

app.enable("trust proxy")

app.set("port", portHandler(config.server.port))

app.use(helmet())
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(favicon(path.resolve("src", "assets", "favicon.png")))
app.use(new RateLimiter())

// API's
// app.use("/v1", v1)
app.use("/v1", v1)
// app.use("/v2", v2)

// app.get("/", rootHandler)

// Handler
app.get("/robots.txt", robotsHandler)

// Errors
app.get("*", err404Handler)

let routes = getRoutes(app)
for (let i in routes){
    log.info(`Route ${routes[i].path} registered with methods ${(routes[i].methods).join(", ")}`)
}

process.on("unhandledRejection", (err, promise) => {
    log.error(`Unhandled rejection (promise: ${promise}, reason: ${err})`)
})

app.listen(app.get("port"), (err) => {
    if (err){
        log.error(`Error on port ${app.get("port")}: ${err}`)
        process.exit(1)
    }
    log.info(`Listening on port ${app.get("port")}...`)
})