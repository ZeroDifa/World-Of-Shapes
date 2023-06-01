const config = require("../config/config");
const bcrypt = require("bcrypt");
const fs = require('fs');
const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const { scanDirectory } = require('./helpers')
const ObjectId = require('mongodb').ObjectId; 
const { getCookie } = require('../middleware/auth.js');
const { checkFileExists, createFile } = require("../controllers/helpers");

exports.register = async (req, res) => {
    if ([req.body.nickname, req.body.password].includes(undefined)) {
        res.status(400).send({  "error": "Неверный формат данных" })
        return
    }
    if (req.body.password.length < 5 || req.body.password.length > 15) {
        res.status(400).send({  "error": "длина пароля должна быть больше 5 и меньше 15 символов" })
        return
    }
    if (req.body.nickname.length < 3 || req.body.nickname.length > 10) {
        res.status(400).send({  "error": "Длина ника должна быть больше 3 и меньше 10 символов" })
        return
    }
    let findedByNickname = await db.find('users', {nickname: req.body.nickname})
    if (findedByNickname.length !== 0) {
        res.status(409).send({  "error": "Пользователь с таким логином уже существует" })
        return
    }

    const salt = await bcrypt.genSalt(10);
    const hasPassword = await bcrypt.hash(req.body.password, salt);
    let user = new User({
        nickname: req.body.nickname,
        password: hasPassword,
    })
    let result = await db.insert('users', user);
    let payload = {id: result.insertedId};

    const token = jwt.sign(payload, config.TOKEN_SECRET, { expiresIn: '24h',});
    res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3600000), 
        httpOnly: true,
        secure: true,
    });
    res.status(200).send({ token })
}
exports.logout = async (req, res) => {
    res.clearCookie('jwt');
    res.redirect('/');
}


exports.login = async (req, res) => {
    if ([req.body.nickname, req.body.password].includes(undefined)) {
        res.status(400).send({  "error": "Неверный формат данных" })
        return
    }
    let result = await db.find('users', {nickname: req.body.nickname})

    if (result.length === 0) {
        res.status(401).send({  "error": "Неверный никнейм/пароль"});
        return
    }
    result = result[0];
    const validPass = await bcrypt.compare(req.body.password, result.password);
    if (!validPass) {
        res.status(401).send({  "error": "Неверный никнейм/пароль"});
        return
    }

    let payload = {id: result._id};

    const token = jwt.sign(payload, config.TOKEN_SECRET, { expiresIn: '24h',});
    res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3600000), 
        httpOnly: true,
        secure: true,
    });
    console.log(payload)
    res.status(200).send({ token })
}

exports.createCharacter = async (req, res) => {
    l(req.body)
    if ([req.body.nickname, req.body.class].includes(undefined)) {
        return res.status(400).send({  "error": "Неверный формат данных" })
    }
    if (!['mage', "hunter"].includes(req.body.class)) {
        return res.status(400).send({  "error": "Странный класс" })
    }
    if (req.body.nickname.length < 3 || req.body.nickname.length > 15) {
        return res.status(400).send({  "error": "Длина ника должна быть больше 3 и меньше 15 символов" })
    }
    const token = getCookie('jwt', req.headers);
    let payload = jwt.decode(token);
    let user = await db.find('users', {_id: new ObjectId(payload.id)})
    let savePath = 'usersaves/' + payload.id + '.json';
    if (user.length == 1 && checkFileExists(savePath)) {
        const file = require('../' + savePath)
        const uniqueID = Date.now().toString(16) + Math.floor(Math.random()*10000).toString(16);

        file[uniqueID] = { ...config.basic_characteristics[req.body.class == 'mage' ? 1 : 2] };
        file[uniqueID]["nickname"] = req.body.nickname;
        file[uniqueID]["class"] = req.body.class;
        fs.writeFile(savePath, JSON.stringify(file, null, 4), function writeJSON(err) {
            l(err)
        });
    } else return res.status(400).send({"error": "Что то пошло не так." })

    res.status(200).send(true)
}



let img_list = scanDirectory("../client/images/spells/");
let b_list = scanDirectory("../client/images/bonuses/");


exports.getImgList = async (req, res) => {
    res.end(JSON.stringify({
        img_list: img_list,
        b_list: b_list
    }))
}

exports.getCharactersList = async (req, res) => {
    const token = getCookie('jwt', req.headers);
    let payload = jwt.decode(token);
    const filePath = 'usersaves/'+ payload.id +'.json';
    res.sendFile(path.resolve(filePath));
}

exports.getSpellsInfo = async (req, res) => {
    res.sendFile(path.resolve("config/spells.json"));
}

exports.bacisCharacteristics = async (req, res) => {
    res.status(200).send(config.basic_characteristics);
}
