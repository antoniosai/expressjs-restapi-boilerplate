let verifyJWTToken = require('../libs/auth')
let apiResponse = require('../helpers/apiResponse')

let verifyJWT = function verifyJWT_MW(req, res, next) {

    let token_string = req.headers.authorization

	let token = token_string.split(' ')[1]

    verifyJWTToken(token)
        .then((decodedToken) => {
            req.user = decodedToken.data
            next()
        })
        .catch((err) => {
            res.status(400)
                .json({
                    message: "Invalid auth token provided."
                })
        })
}

module.exports = verifyJWT