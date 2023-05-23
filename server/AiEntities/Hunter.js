const { Entity } = require("../Entity");
const { Vector2 } = require("../Vector2");

class Hunter extends Entity {
    constructor(GameServer) {
        super(GameServer.w / 2, GameServer.h / 2, GameServer);
        this.type = 'mob';
        this.class = 2;
        this.name = this.randomItem(["Merlin", "Gandalf", "Hermione", "Dumbledore", "Morgana", "Elminster", "Medivh", "Saruman", "Willow", "Prospero"]);
        this.lastTargetChange = performance.now()
        super.spawnEntity()

    }
    randomItem(items) {
        return items[Math.floor(Math.random()*items.length)]
    }
    findTarget() {
        if (this.target !== null && new Vector2(this, this.target).distance > 150 && !this.isInvisibility) {
            if (this.hpPercent < 50) {
                this.trySpell(3);
                this.aim.p = new Point(rnd([0, this.GameServer.w]), rnd([0, this.GameServer.h]), this.GameServer)
                this.target = null;
                return;
            }
            this.trySpell(this.AllowSpells[1]);
        }

        if (performance.now()-this.lastTargetChange < 3000) return
        this.lastTargetChange = performance.now();
        for (let obj of this.GameServer.objects) {
            if (!this.isOnViewPort(obj) || this.isInvisibility || obj.isInvisibility || 
                obj.type == 'spell' || obj.type == 'mob' || this.spell != null || this.processingSpell || 
                this.CheckSpell('global') || obj == this || new Vector2(this, obj).distance < 300) continue
            this.target = obj;
            this.aim.p = obj;
            
            
            return
        }
        this.aim.p = new Point(rnd([0, this.GameServer.w]), rnd([0, this.GameServer.h]), this.GameServer)
    }
    move() {
        super.move()
        if (this.spell == null) this.findTarget()
    }
    kill() {
        super.kill()
        setTimeout(() => { super.spawnEntity() }, 1000)
    }
}
module.exports.Hunter = Hunter