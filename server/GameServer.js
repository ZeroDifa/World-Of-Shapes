let WebSocket = require('ws');
const Mage = require("./AiEntities/Mage").Mage
const Hunter = require("./AiEntities/Hunter").Hunter
class GameServer {
    constructor(port, nameServer) {
        this.nameServer = nameServer;
        this.server = this;
        this.webSocketServer = new WebSocket.Server({port: port}).on('connection', (ws, req) => {
            new Player(ws, this, req.headers['x-forwarded-for'])
            l(this.onl)
        })
        this.updateList = [];
        this.port = port;
        this.clients = {};
        this.objects = [];
        this.w = 3500;
        this.h = 3500;
        this.OIDS = 0;
        this.px = 500
        this.freeIDS = [];
        this.isCollision = true;
        this.viewRatio = 600;
        this.isRadialView = false;
        this.SafeZone = {
            x: 300, y: 300,
            size: 200
        }
        // for (let i = 0; i < 8; i++) new Mage(this);
        for (let i = 0; i < 18; i++) new Hunter(this);
    }
    getUniqueIdentifier() {
        let id = this.freeIDS.length == 0 ? this.OIDS++ : this.freeIDS.pop();
        return id
    }
    hasClient(id) {
        return this.clients.hasOwnProperty(id)
    }
    boot() {
        let now = performance.now()
        this.update()
        let fut = performance.now() - now;
        this.deltaTime = 1000/60 - fut;
        if (this.deltaTime < 0) this.deltaTime = 0;
        this.bootTimeout = setTimeout(() => {this.boot()}, this.deltaTime)
    }
    stop() {
        clearTimeout(this.bootTimeout)
    }
    update() {
        for (let obj of this.objects) {
            obj.move()
        }
        for (let obj of this.updateList) {
            obj.update();
        }
        for (let id in this.clients) {
            let client = this.clients[id]
            if (client.ws == null) continue
            this.sendNewObj(client)
            client.send_position_objects()
        }
    }
    connect_to_gameServer(client) {
        this.clients[client.id] = client
    }
    disconnect_from_server(client) {
        client.kill()
        this.freeIDS.push(client.id);
        delete this.clients[client.id]
    }
    sendNewObj(client) {
        if (client.ws == null) return
        let remove = [], append = [],
            w = new Writer(), rem = new Writer();
        for (let id in client.objectsInVision) {
            let c = client.objectsInVision[id]
            if (c.type == 'spell') {
                if (![4, 5].includes(c.spell_id)) {
                    l("not this spells")
                    continue
                }
                if (!client.isOnViewPort(c)) {
                    client.sendMessage(new Writer().uint8(17).uint16(c.id));
                    delete client.objectsInVision[c.id];
                    continue
                }
            }
            if (!c.isLife) {
                delete client.objectsInVision[c.id]
                remove.push(c)
            }
        }
        w.uint8(2);
        rem.uint8(3);
        for (let obj of this.objects) {
            if (obj.type == 'spell') {
                
                continue
            }
            if (client.isOnViewPort(obj) && !obj.isInvisibility) {
                if (client.objectsInVision[obj.id] == undefined) {
                    client.objectsInVision[obj.id] = obj
                    append.push(obj)
                }
            } else {
                if (obj.isInvisibility && client.objectsInVision[obj.id] == obj) {
                    if (obj != client) {
                        if (client.target == obj) client.target = null;
                        delete client.objectsInVision[obj.id]
                        remove.push(obj)
                    }
                } else if (client.objectsInVision[obj.id] == obj) {
                    if (client.target == obj) client.target = null;
                    delete client.objectsInVision[obj.id]
                    remove.push(obj)
                }
            }
        }
        if (append.length > 0){
            w.uint16(append.length);
            for (let obj of append) {
                w.uint16(obj.id).uint8(obj.class).uint16(Math.round(obj.x)).uint16(Math.round(obj.y))
                 .color(obj.color).uint8(obj.radius)
                 .uint8(obj.name.toString().length).ztstringucs2(obj.name.toString())
                 .uint16(obj.maxHp).uint16(obj.hp).uint8(obj.level)
                if (obj == client) w.uint16(obj.xp)
                switch (obj.class) {
                    case 1:
                        w.uint16(obj.maxMp).uint16(obj.mp)
                        break;
                    case 2:
                        w.uint16(obj.maxEnergy).uint16(obj.energy)
                        break;
                }
                w.uint8(obj.Effects.length);
                for (let eff of obj.Effects) {
                    w.uint8(eff.effect_id).uint16(Math.floor(eff.remain))
                }
                if (obj.class == 2) w.float32(obj.angle)
                if (obj == client) w.float32(obj.viewAngle)
            }
            client.sendMessage(w)
        }
        if (remove.length > 0) {
            rem.uint16(remove.length);
            for (let obj of remove) {
                rem.uint16(obj.id)
                if (obj.isInvisibility && obj.isLife) {
                    rem.uint8(1)
                }
                else rem.uint8(0)
            }
            client.sendMessage(rem)
        }
    }
}

module.exports.GameServer = GameServer;
