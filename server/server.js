const express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    DataBase = require('./controllers/db.js');
require("./GameCore_init.js");

let db = new DataBase(
    "mongodb://127.0.0.1:27017/WorldOfShapes", 
    { useNewUrlParser: true, useUnifiedTopology: true }
);
db.connect();
global.db = db;



let app = express();
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/static', express.static('../client/'))
app.use('/api', require('./routes/api'));
app.use('/', require('./routes/indexroutes'));

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
    } catch (e) {
        l(e)
    };
});



