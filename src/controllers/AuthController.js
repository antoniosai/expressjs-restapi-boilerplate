const User = require("../models/UserModel")
const {
	body,
	validationResult
} = require("express-validator")
const {
	sanitizeBody
} = require("express-validator")
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse")
const utility = require("../helpers/utility")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mailer = require("../helpers/mailer")
const config = require("../config")
const {
	constants
} = require("../helpers/constants")
const verifyJWT = require('../middlewares/jwt')

exports.me = [
	function (req, res, next) {

		return apiResponse.successResponseWithData(res, 'okk jwt', verifyJWT)

		// return apiResponse.successResponseWithData(res, 'ok', [req.headers['authorization']])
		let token = req.headers.authorization
		let access_token = token.split(' ')[1]
		if (!access_token) return res.status(401).send({
			auth: false,
			message: 'No token provided.'
		})

		jwt.verify(access_token, config.secret, function (err, decoded) {
			if (err) return res.status(500).send({
				auth: false,
				message: 'Failed to authenticate token.'
			})

			User.findById(decoded.id, function (err, user) {
				if (err) return res.status(500).send("There was a problem finding the user.")
				if (!user) return res.status(404).send("No user found.")

				res.status(200).send(user)
			})
		})
	}
]

exports.test = [
	function (req, res) {
		return apiResponse.successResponseWithData(res, "Operation success", [])
	}
]

/**
 * User registration.
 *
 * @param {string}      first_name
 * @param {string}      last_name
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.register = [
	// Validate fields.
	body("first_name").isLength({
		min: 1
	}).trim().withMessage("First name must be specified.")
	.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("last_name").isLength({
		min: 1
	}).trim().withMessage("Last name must be specified.")
	.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({
		min: 1
	}).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
		return User.findOne({
			email: value
		}).then((user) => {
			if (user) {
				return Promise.reject("E-mail already in use")
			}
		})
	}),
	body("password").isLength({
		min: 6
	}).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	sanitizeBody("first_name").escape(),
	sanitizeBody("last_name").escape(),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {

		try {
			// Extract the validation errors from a req.body.
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array())
			} else {
				//hash input password
				bcrypt.hash(req.body.password, 10, function (err, hash) {
					// generate OTP for confirmation

					let otp = utility.randomNumber(4)
					// Create User object with escaped and trimmed data
					let user = new User()
					user.first_name = req.body.first_name
					user.last_name = req.body.last_name
					user.email = req.body.email
					user.password = hash
					user.is_confirmed = req.body.is_confirmed
					user.is_active = req.body.is_active
					// save the user and check for errors
					user.save(function (err) {
						if (err)
							res.json(err)

						let token = jwt.sign({
							id: user._id
						}, config.secret, {
							expiresIn: 86400 // expires in 24 hours
						})


						return apiResponse.successResponseWithData(res, "Registration Success.", {
							auth: true,
							token: token
						})
					})

					// Html email body
					// let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>"
					// // Send confirmation email
					// mailer.send(
					// 	constants.confirmEmails.from,
					// 	req.body.email,
					// 	"Confirm Account",
					// 	html
					// ).then(function () {
					// 	// Save user.
					// 	user.save(function (err) {
					// 		if (err) {
					// 			return apiResponse.ErrorResponse(res, err)
					// 		}
					// 		let userData = {
					// 			_id: user._id,
					// 			first_name: user.first_name,
					// 			last_name: user.last_name,
					// 			email: user.email
					// 		}
					// 		return apiResponse.successResponseWithData(res, "Registration Success.", userData)
					// 	})
					// }).catch(err => {
					// 	console.log(err)
					// 	return apiResponse.ErrorResponse(res, err)
					// })
				})
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err)
		}
	}
]

/**
 * User login.
 *
 * @param {string}      email
 * @param {string}      password
 *
 * @returns {Object}
 */
exports.login = [
	body("email").isLength({
		min: 1
	}).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({
		min: 1
	}).trim().withMessage("Password must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array())
			} else {
				User.findOne({
					email: req.body.email
				}).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password, user.password, function (err, same) {
							if (same) {
								//Check account confirmation.
								if (user.is_confirmed) {
									// Check User's account active or not.
									if (user.is_active) {
										let userData = {
											_id: user._id,
											first_name: user.first_name,
											last_name: user.last_name,
											email: user.email,
										}
										//Prepare JWT token for authentication
										const jwtPayload = userData
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION,
										}
										const secret = process.env.JWT_SECRET
										//Generated JWT token with Payload and secret.
										userData.token = jwt.sign(jwtPayload, secret, jwtData)
										return apiResponse.successResponseWithData(res, "Login Success.", userData)
									} else {
										return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.")
									}
								} else {
									return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.")
								}
							} else {
								return apiResponse.unauthorizedResponse(res, "Email or Password wrong.")
							}
						})
					} else {
						return apiResponse.unauthorizedResponse(res, "Email or Password wrong.")
					}
				})
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err)
		}
	}
]

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
exports.verifyConfirm = [
	body("email").isLength({
		min: 1
	}).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address."),
	body("otp").isLength({
		min: 1
	}).trim().withMessage("OTP must be specified."),
	sanitizeBody("email").escape(),
	sanitizeBody("otp").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array())
			} else {
				let query = {
					email: req.body.email
				}
				User.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if (!user.is_confirmed) {
							//Check account confirmation.
							if (user.confirmOTP == req.body.otp) {
								//Update user as confirmed
								User.findOneAndUpdate(query, {
									is_confirmed: 1,
									confirmOTP: null
								}).catch(err => {
									return apiResponse.ErrorResponse(res, err)
								})
								return apiResponse.successResponse(res, "Account confirmed success.")
							} else {
								return apiResponse.unauthorizedResponse(res, "Otp does not match")
							}
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.")
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.")
					}
				})
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err)
		}
	}
]

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({
		min: 1
	}).trim().withMessage("Email must be specified.")
	.isEmail().withMessage("Email must be a valid email address."),
	sanitizeBody("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array())
			} else {
				let query = {
					email: req.body.email
				}
				User.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if (!user.is_confirmed) {
							// Generate otp
							let otp = utility.randomNumber(4)
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>"
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"Confirm Account",
								html
							).then(function () {
								user.is_confirmed = 0
								user.confirmOTP = otp
								// Save user.
								user.save(function (err) {
									if (err) {
										return apiResponse.ErrorResponse(res, err)
									}
									return apiResponse.successResponse(res, "Confirm otp sent.")
								})
							})
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.")
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.")
					}
				})
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err)
		}
	}
]