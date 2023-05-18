class Mobs extends Entity {
    constructor(GameServer, c) {
        super(GameServer.w / 2, GameServer.h / 2, GameServer);
        this.type = 'mob';
        this.class = c;
        this.name = this.id;
        this.targetChange = performance.now()
        super.spawnEntity()

    }
    randomItem(items) {
        return items[Math.floor(Math.random()*items.length)]
    }
    findTarget() {
        if (performance.now()-this.targetChange < 3000) return
        this.targetChange = performance.now()
        if (this.class == 2) {
            this.aim.p = new Point(rnd([0, this.GameServer.w]), rnd([0, this.GameServer.h]), this.GameServer)
            if (this.hpPercent < 50) {
                this.trySpell(6)
            }
            return
        }
        for (let obj of this.GameServer.objects) {
            if (!this.isOnViewPort(obj) || obj.isInvisibility || obj.type == 'spell' || this.spell != null || this.processingSpell || this.CheckSpell('global') || obj == this) continue
            this.target = obj;
            this.aim.p = this;
            if (this.hpPercent < 50) {
                this.trySpell(3)
            }
            this.trySpell(1)
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
module.exports.Mobs = Mobs