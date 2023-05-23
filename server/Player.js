const { SpellsInfo } = require("./Spell");
const { Vector2 } = require("./Vector2");

class Player extends Entity {
    constructor(ws, GameServer, ip) {
        super(GameServer.w / 2, GameServer.h / 2, GameServer);
        this.ws = ws;
        this.ip = ip;
        if (ip != undefined) console.log(this.ip)
        this.type = 'player';
        this.class = null;
        if (this.ws != null) {
            this.sendMessage(JSON.stringify({
                w: this.GameServer.w,
                h: this.GameServer.h,
                ratio: this.GameServer.viewRatio,
                isR: this.GameServer.isRadialView,
                updatableObjects: SpellsInfo.updatableObjects,
                id: 'server_settings'
            }))
            this.ws.onmessage = onmessage.bind(this);
            this.ws.onclose = onclose.bind(this);
        };
    }
    startGame(name) {
        super.initStatsByClass()
        super.spawnEntity()
        this.name = name.length > 0 ? name : this.id;
        let w = new Writer();
        // sending player specifications
        w.uint8(1).uint16(this.id);
        let alsp = this.AllowSpells.slice(1);
        w.uint8(alsp.length)
        alsp.forEach(id => {
            w.uint8(id)
        });
        this.sendMessage(w);
    }
    send_position_objects() {
        let arr = [];
        let w = new Writer().uint8(4);
        for (let id in this.objectsInVision) {
            let t = this.objectsInVision[id]
            // if (t.type == 'spell' && t.spell_id == 4) continue
            if (t.type != 'spell' && !t.isLife || (t.isInvisibility && t.id != this.id)) continue
            arr.push(t)
        }
        if (arr.length == 0) return
        w.uint16(arr.length)
        for (let t of arr) {
            w.uint16(t.id).uint16(Math.floor(t.x)).uint16(Math.floor(t.y));
            if (t.class == 2) w.float32(t.angle)
        }
        this.sendMessage(w)
    }
}
function onmessage(e) {
    let data = JSON.parse(e.data)
    switch (data.id) {
        case 'start':
            this.name = data.name;
            this.class = parseInt(data.class);
            this.startGame(data.name);
            break
        case 1:
            if (this.isLife) break
            this.x = data.Mx;
            this.y = data.My;
            this.checkBorders()
            break
        case 2:
            if (data.cid == -1) {
                this.target = null;
                if (this.spell != null) this.spell.breakProcessing()
                break
            }
            if (this.isLife) this.target = this.GameServer.objects.find(p => {
                return p.id == data.cid
            })
            break
        case 'aim':
            this.aim.p = new Point(data.x, data.y, this.GameServer)
            // this.aim.p.checkBorders()
            break
        case 'cast':
            new Spell(data.spell_id, this, this.target);
            break
        default:
            console.log(performance.now(), data)
            break
    }
}
function onclose() {
    this.GameServer.disconnect_from_server(this);
}

module.exports.Player = Player