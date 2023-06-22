const { Entity } = require("../Entity");

class Mage extends Entity {
    constructor(GameServer, characterId) {
        super(GameServer.w / 2, GameServer.h / 2, GameServer);
        this.type = 'mob';
        this.userId = 'bots';
        this.characterId = characterId;
        this.class = 1;
        this.name = this.randomItem(["Merlin", "Gandalf", "Hermione", "Dumbledore", "Morgana", "Elminster", "Medivh", "Saruman", "Willow", "Prospero"]);
        this.lastTargetChange = performance.now();
        this.timeToChengeTarget = rnd([1000, 10000]);
    }
    randomItem(items) {
        return items[Math.floor(Math.random()*items.length)]
    }
    findTarget() {
        if (performance.now()-this.lastTargetChange < 1000) return
        this.lastTargetChange = performance.now();
        for (let obj of this.GameServer.objects) {
            if (!this.isOnViewPort(obj) || obj.isInvisibility || obj.type == 'spell' || this.spell != null || this.processingSpell || this.CheckSpell('global') || obj == this) continue
            this.target = obj;
            this.aim.p = this;
            if (this.hpPercent < 50) {
                this.trySpell(3);
            }
            this.trySpell(1);
            return
        }
        this.aim.p = new Point(rnd([0, this.GameServer.w]), rnd([0, this.GameServer.h]), this.GameServer)
    }
    move() {
        super.move()
        if (this.spell == null) this.findTarget()
    }
    kill(attacker) {
        super.kill(attacker)
        setTimeout(() => { super.spawnEntity() }, 1000)
    }
}
module.exports.Mage = Mage