global.l = console.log;
global.lg = new require('./logger.js').Logger;
global.performance = performance;
global.Vector2 = require('./Vector2.js').Vector2;
global.Entity = require('./Entity.js').Entity;
global.Mobs = require('./Mobs.js').Mobs;
global.Player = require('./Player.js').Player;
global.Point = require('./Point.js').Point;
global.Writer = require('./Writer.js').Writer;
global.Effect = require('./Effect.js').Effect;
global.Spell = require('./Spell.js').Spell;
global.SpellsInfo = require('./Spell.js').SpellsInfo;
global.rnd = function rnd(arr) {
    arr[0] = Math.ceil(arr[0]);
    arr[1] = Math.floor(arr[1]);
    return Math.floor(Math.random() * (arr[1] - arr[0])) + arr[0];
}
global.deleteFromArray = function (array, element) {
    let i = array.indexOf(element);
    if (i !== -1) {array.splice(i, 1)}
}
global.checkBorders = function checkBorders() {
    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x > this.GameServer.w) this.x = this.GameServer.w;
    if (this.y > this.GameServer.h) this.y = this.GameServer.h;
}