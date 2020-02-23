let express = require("express")
let UserController = require("../../controllers/UserController")
let verifyJWT_MW = require('../../middlewares/jwt')

let router = express.Router()

router.all('*', verifyJWT_MW)

router.route('/')
    .get(UserController.index)
    .post(UserController.new)

router.route('/:user_id')
    .get(UserController.view)
    .patch(UserController.update)
    .put(UserController.update)
    .delete(UserController.delete)

module.exports = router