const router = require('express').Router();
const userController = require('../controllers/user');
const { verifyUserToken } = require("../middleware/auth");

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/getimglist', verifyUserToken, userController.getImgList);
module.exports = router;
