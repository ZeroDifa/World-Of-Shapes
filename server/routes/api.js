const router = require('express').Router();
const userController = require('../controllers/user');
const { verifyUserToken } = require("../middleware/auth");

router.post('/register', userController.register);

router.post('/login', userController.login);

router.get('/logout', verifyUserToken, userController.logout);

router.post('/createCharacter', verifyUserToken, userController.createCharacter);

router.get('/getimglist', verifyUserToken, userController.getImgList);

router.get('/spellsInfo', verifyUserToken, userController.getSpellsInfo);

router.get('/getCharactersList', verifyUserToken, userController.getCharactersList);

router.get('/bacisCharacteristics', verifyUserToken, userController.bacisCharacteristics);


module.exports = router;
