const router = require('express').Router();
const { getCookie, authWithRedirect } = require('../middleware/auth.js');
const path = require('path');
const config = require("../config/config");
const jwt = require('jsonwebtoken')
const ObjectId = require('mongodb').ObjectId; 
const { checkFileExists, createFile } = require("../controllers/helpers");

router.get('/', authWithRedirect, async (req, res, next) => {
    const token = getCookie('jwt', req.headers);
    try {
        let payload = jwt.decode(token);
        let user = await db.find('users', {_id: new ObjectId(payload.id)})
        if (user.length == 0) return res.status(409).send({  "error": "Error" })
        let savePath = 'usersaves/' + payload.id + '.json';
        if (!checkFileExists(savePath)) {
            createFile(savePath, {});
        }
        return res.redirect('/choicemenu');
    } catch (error) {
        res.status(400).send({ error: "Invalid Token" });
    }
    
})

router.get('/game', authWithRedirect, (req, res) => {
    res.sendFile(path.resolve('./htmls/index.html'));
})

router.get('/choicemenu', authWithRedirect, (req, res) => {
    res.sendFile(path.resolve('./htmls/choicemenu.html'))
})

router.get('/createmenu', authWithRedirect, (req, res) => {
    res.sendFile(path.resolve('./htmls/createmenu.html'))
})

router.get('/signin', (req, res) => {
    res.sendFile(path.resolve('./htmls/signin.html'))
})

router.get('/signup', (req, res) => {
    res.sendFile(path.resolve('./htmls/signup.html'))
})

router.get('*', (req, res) => {
    res.redirect('/');
});
  

module.exports = router;
