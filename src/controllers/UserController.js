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
const {
    constants
} = require("../helpers/constants")

exports.index = [
    function (req, res) {
        User.get(function (err, users) {
            if (err) {
                res.json({
                    is_active: "error",
                    message: err,
                })
            }
            return apiResponse.successResponseWithData(res, 'Successfully fetched Data', users)
        })
    }
]

exports.new = [
    function (req, res) {

        let request = req.body
        
        bcrypt.hash(req.body.password, 10, function (err, hash) {
            // generate OTP for confirmation

            // Create User object with escaped and trimmed data
            let user = new User();
            user.first_name = req.body.first_name;
            user.last_name = req.body.last_name;
            user.email = req.body.email;
            user.password = hash;
            user.is_confirmed = req.body.is_confirmed;
            user.is_active = req.body.is_active;
            // save the user and check for errors
            user.save(function (err) {
                if (err) {
                    return apiResponse.ErrorResponse(res, err)
                }
                return apiResponse.successResponseWithData(res, "Registration Success.", user);
            });

        })

    }
]

exports.view = [
    function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
            if (err)
                res.send(err)
            return apiResponse.successResponseWithData(res, 'Successfully fetched user', user)
        })
    }
]

// Handle update user info
exports.update = [
    function (req, res) {
        User.findById(req.params.user_id, function (err, user) {
    
            let request = req.body
    
            if (err)
                res.send(err)
                user.first_name = request.first_name
                user.last_name = request.last_name
                user.email = request.email
                user.password = request.password
                user.is_confirmed = request.is_confirmed
                user.confirmOTP = request.confirmOTP
                user.otpTries = request.otpTries
                user.is_active = request.is_active
            // save the user and check for errors
            user.save(function (err) {
                if (err)
                    return apiResponse.ErrorResponse(res, err)
                return apiResponse.successResponseWithData(res, 'Successfully updated user', user)
            })
        })
    }
]
// Handle delete user
exports.delete = [
    function (req, res) {
        User.remove({
            _id: req.params.user_id
        }, function (err) {
            if (err)
                res.send(err)
            res.json({
                is_active: "success",
                message: 'user deleted'
            })
        })
    }
]