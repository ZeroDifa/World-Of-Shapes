const fs = require('fs');
const path = require('path');

exports.checkFileExists = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
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