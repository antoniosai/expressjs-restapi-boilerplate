const config = require("../config")
const jwt = require('jsonwebtoken')

let verifyJWTToken = function(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, config.secret, (err, decodedToken) => {
            if (err || !decodedToken) {
                return reject(err)
            }

            resolve(decodedToken)
        })
    })
}

module.exports = verifyJWTToken