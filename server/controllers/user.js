const fs = require('fs');
const path = require('path');
const config = require("../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.js");


exports.register = async (req, res) => {
    console.log(req.body)
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
    res.status(200).send({ token })
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
    res.status(200).send({ token })
}



function scanDirectory(directoryPath) {
    const files = fs.readdirSync(directoryPath);
    
    const result = files.map(file => {
      const filePath = path.join(directoryPath, file);
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const fileSizeInKB = Math.floor(fileSizeInBytes /1024);
      return {
        name: file,
        filesize: fileSizeInKB
      };
    });
    
    return result;
}

let img_list = scanDirectory("../client/images/spells/");
let b_list = scanDirectory("../client/images/bonuses/");


exports.getImgList = async (req, res) => {
    res.end(JSON.stringify({
        img_list: img_list,
        b_list: b_list
    }))
}