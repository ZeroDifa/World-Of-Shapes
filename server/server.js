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

const GameServer = require('./GameServer.js').GameServer;
const Servers = {};

Servers[1337] = new GameServer(1337, 'server one');


for (let port in Servers) {
    Servers[port].boot();
    Servers[port].connectBots();
}




process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (text) {
    try {
        l(eval(text.trim()))
    } catch (e) {
        l(e)
    };
});



