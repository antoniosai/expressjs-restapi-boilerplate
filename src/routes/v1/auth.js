let express = require("express")
const AuthController = require("../../controllers/AuthController")
let verifyJWT_MW = require('../../middlewares/jwt')

let router = express.Router()

// router.all('*', verifyJWT_MW)

router.post("/me", AuthController.me)
router.post("/register", AuthController.register)
router.post("/login", AuthController.login)

module.exports = router