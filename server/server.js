const http = require('http'),
    {performance} = require('perf_hooks'),
    express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    DataBase = require('./controllers/db.js');

require("./GameCore_init.js");

let db = new DataBase("mongodb://127.0.0.1:27017/WorldOfShapes", { useNewUrlParser: true, useUnifiedTopology: true });

db.connect();
global.db = db;

let app = express();
app.use(bodyParser.json());
app.use(express.static('../client'))
app.use('/api', require('./routes/index'));

app.listen(8080, function(){
    console.log("Server running on localhost:" + 8080);
});



let GameServer = require('./GameServer.js').GameServer;
new GameServer(1337, 'server one').boot()

process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (text) {
    try {
        eval(text.trim())
    } catch (e) {};
    try {
        eval('l(' + text.trim() + ')')
    } catch (e) {};
});



