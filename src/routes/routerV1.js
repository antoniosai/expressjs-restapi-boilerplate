"use strict"

// ========================= //
// = Copyright (c) NullDev = //
// ========================= //

// Dependendies
let express = require("express")

// Init router
// eslint-disable-next-line new-cap
let router = express.Router()

let app = express()

app.use("/auth", require("./v1/auth"))
app.use("/users", require("./v1/users"))

module.exports = app
