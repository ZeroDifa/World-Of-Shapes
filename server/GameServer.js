let WebSocket = require('ws');
const Mage = require("./AiEntities/Mage").Mage
const Hunter = require("./AiEntities/Hunter").Hunter
const { readFile } = require("./controllers/helpers");

class GameServer {
    constructor(port, nameServer) {
        this.nameServer = nameServer;
        this.port = port;
        this.server = this;
        this.webSocketServer = new WebSocket.Server({port: port}).on('connection', (ws, req) => {
            new Player(ws, this, req.headers['x-forwarded-for'])
        })
        this.updateList = [];
        this.clients = {};
        this.objects = [];
        this.w = 3500;
        this.h = 3500;
        this.OIDS = 0;
        this.px = 500;
        this.freeIDS = [];
        this.isCollision = true;
        this.viewRatio = 700;
        this.isRadialView = true;
        this.SafeZone = {
            x: 300, y: 300,
            size: 200
        }
        this.top = {};
        this.timeToSendTop = performance.now();
    }
    async connectBots() {
        let list = JSON.parse(await readFile('usersaves/bots.json'));
        let b;
        for (let id in list) {
            switch (list[id].class) {
                case 'mage':
                    b = new Mage(this, id);
                    await b.readSave(id);
                    b.spawnEntity();
                    break;
                case 'hunter':
                    b = new Hunter(this, id);
                    await b.readSave(id);
                    b.spawnEntity();
                default:
                    break;
            }
        }
    }
    getUniqueIdentifier() {
        let id = this.freeIDS.length == 0 ? this.OIDS++ : this.freeIDS.pop();
        return id
    }
    hasClient(id) {
        return this.clients.hasOwnProperty(id)
    }
    boot() {
        let before = performance.now()
        this.update()
        let after = performance.now() - before;
        this.deltaTime = 1000/60 - after;
        if (this.deltaTime < 0) this.deltaTime = 0;
        this.bootTimeout = setTimeout(() => {this.boot()}, this.deltaTime)
    }
    disconnectAll() {
        for (let id in this.clients) {
            this.disconnect_from_server(this.clients[id]);
        }
    }
    stop() {
        this.disconnectAll();
        clearTimeout(this.bootTimeout)
    }
    async sendTop() {
        let clients = [];
        for (let id in this.clients) {
            let c = this.clients[id];
            if (c.waitToken || c.waitCharID) {
                console.log('unauth now');
                continue
            };
            clients.push({
                level: c.save.level,
                kills: c.save.kills,
                name: c.save.nickname,
                class: c.save.class
            })
            
        }
        clients.sort(function(a, b) {
            return b.kills - a.kills;
        });
        for (let id in this.clients) {
            let c = this.clients[id];
            c.sendMessage(JSON.stringify(
                {
                    top: clients.slice(0, 10),
                    id: 'top'
                }
            ))
        }
          
    }
    update() {
        if (performance.now() - this.timeToSendTop > 1000) {
            this.timeToSendTop = performance.now();
            this.sendTop();
        }
        for (let obj of this.objects) obj.move();
        for (let obj of this.updateList) obj.update();

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
    async disconnect_from_server(client) {
        client.kill();
        await client.writeSave();
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
                 .color(obj.color).uint8(obj.save.radius)
                 .uint8(obj.save.nickname.toString().length).ztstringucs2(obj.save.nickname.toString())
                 .uint16(obj.maxHp).uint16(obj.hp).uint8(obj.save.level)
                if (obj == client) w.uint32(Math.ceil(obj.save.xp))
                switch (obj.class) {
                    case 1:
                        w.uint16(obj.maxMp).uint16(obj.mp)
                        break;
                    case 2:
                        w.uint16(obj.save.maxEnergy).uint16(obj.energy)
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
