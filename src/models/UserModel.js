let mongoose = require("mongoose")

let UserSchema = new mongoose.Schema({
	first_name: {type: String, required: true},
	last_name: {type: String, required: true},
	email: {type: String, required: true},
	password: {type: String, required: true},
	is_confirmed: {type: Boolean, required: true, default: 0},
	is_active: {type: Boolean, required: false, default: 1}
}, {timestamps: true})

// Virtual for user's full name
// UserSchema
// 	.virtual("fullName")
// 	.get(function () {
// 		return this.firstName + " " + this.lastName
// 	})


// module.exports = mongoose.model("User", UserSchema)

let User = module.exports = mongoose.model('users', UserSchema)

module.exports.get = function (callback, limit) {
    User.find(callback).limit(limit)
}