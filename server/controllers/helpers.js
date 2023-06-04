const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const util = require('util');

exports.checkFileExists = (filePath) => {
    try {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
    } catch (err) {
        return false;
    }
}

exports.verifyToken = (token) => {
    if (typeof token !== 'string' || token.length == 0) return false;
    try {
        let verifiedUser = jwt.verify(token, config.TOKEN_SECRET);
        if (!verifiedUser) return false;
        let payload = jwt.decode(token);
        if (payload.id == undefined) return false;
        return payload.id;
    } catch (e) {
        return false;
    }
}

exports.createFile = (directory, data = []) => {
    try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(directory, jsonData);
        return true;
    } catch (err) {
        return false;
    }
}
const rF = util.promisify(fs.readFile);
exports.readFile = async (filePath) => {
    try {
        const fileContent = await rF(filePath, 'utf8');
        return fileContent;
      } catch (err) {
        throw err;
      }
      
}
exports.scanDirectory = (directoryPath) => {
    const files = fs.readdirSync(directoryPath);

    const result = files.map(file => {
        const filePath = path.join(directoryPath, file);
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;
        const fileSizeInKB = Math.floor(fileSizeInBytes / 1024);
        return {
            name: file,
            filesize: fileSizeInKB
        };
    });

    return result;
}