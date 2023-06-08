const config = require("./config/config");
const fs = require("fs");
const { checkFileExists, createFile, readFile } = require("./controllers/helpers");
const { Writer } = require("./Writer");

class Entity {
    constructor(x, y, GameServer) {
        this.objectsInVision = {};
        this.GameServer = GameServer;
        this.x = x;
        this.y = y;
        this.type = null;
        this.class = null;
        this.isLife = false;
        this.ws = null;
        this.checkBorders = checkBorders.bind(this);
        this.aim = {
            p: new Point(this.x, this.y),
            target: null
        }
        this.color = 0x606564;
        this.id = this.GameServer.getUniqueIdentifier()
        this.target = null;
        this.name = 'Entity';
        this.isLife = false;
        this.spell = null;
        this.c = 0;
        this.Effects = [];
        this.isCombatStatus = false;
        this.isInvisibility = false;
        this.GameServer.connect_to_gameServer(this);
    }
    setInvisibility(time) {
        this.isInvisibility = true;
        let w = new Writer()
        w.uint8(3).uint16(1).uint16(this.id).uint8(1).uint16(time)
        this.sendMessage(w)
    }
    setCombatStatus(time) {
        this.isCombatStatus = true;
        this.combatStatusTime = time;
        this.combatStatusStart = performance.now();
        this.sendMessage(new Writer().uint8(14))
    }
    removeCombatStatus() {
        this.isCombatStatus = false;
        this.sendMessage(new Writer().uint8(15))
    }
    get hpPercent() {
        return this.hp / this.maxHp * 100
    }
    trySpell(id) {
        if (this.save.AllowSpells.includes(id) && !this.CheckSpell('global') && !this.CheckSpell(id)) {
            new Spell(id, this, this.target);
            return true
        } else return false
    }
    sendMessage(msg) {
        if (this.ws == null) return
        if (msg.constructor.name != 'String') {
            switch (msg.data[0]) {
                case 7:
                    if (!this.GameServer.hasClient(msg.data[1]) || !this.GameServer.hasClient(msg.data[3])) {
                        break
                    }
                    if (!this.GameServer.clients[msg.data[1]].isLife || !this.GameServer.clients[msg.data[3]].isLife) return
                    break
                case 10:
                case 11:
                    if (!this.GameServer.clients[msg.data[1]].isLife) return
                    break
                case 12:
                    break
            }
        }
        this.ws.send(msg.constructor.name == 'String' ? msg : msg.f())
    }
    calculateDmg(dmg) {
        return (dmg + this.spellDamagePower) * this.damageRate
    }
    calculateResist(dmg) {
        return Math.ceil(dmg * (this.save.protection))
    }
    initStatsByMainCharacteristics() {
        this.damageRate = this.save.damageRate;

        this.maxHp = this.save.stamina * 10;
        this.hp = this.maxHp;

        this.maxMp = this.save.intelligence * 10;
        this.mp = this.maxMp;
        this.spellDamagePower += Math.floor(this.save.intelligence * 0.2)

        this.energy = this.save.maxEnergy;
    }
    initStatsByClass() {

        this.initCooldowns();

        this.speed = this.save.speed;
        this.radius = this.save.radius;

        this.spellDamagePower = this.save.spellDamagePower;

        this.rotationEasing = this.save.rotationEasing;
        this.angle = -Math.random() * Math.PI * 2;
        this.viewAngle = Math.PI / 4;
        this.rotationSpeed = (Math.PI / 180) * 4;

        this.initStatsByMainCharacteristics();
    }
    setSpellCooldown(id) {
        if (id == 'global') {
            this.sendMessage(new Writer().uint8(6).uint16(this.cooldowns[id].cooldownTime))
            this.cooldowns[id].setTime()
            return
        }
        this.cooldowns[id].setTime()
    }
    CheckSpell(id) {
        return this.cooldowns[id].available
    }
    initCooldowns() {
        this.cooldowns = {}
        for (let spell of this.save.AllowSpells) {
            this.cooldowns[spell] = new Cooldown(spell, spell == 'global' ? SpellsInfo[spell][this.class] : SpellsInfo[spell])
        }

    }
    doDamage(dmg, attacker) {
        dmg = this.calculateResist(dmg)
        this.reHp(dmg, attacker)
        if (this.hp <= 0) {
            this.kill(attacker)
        } else if (this.hp > this.maxHp) {
            this.hp = this.maxHp
        }
    }
    reMp(mp) {
        mp = Math.round(mp)
        this.mp += mp
        if (this.mp > this.maxMp) this.mp = this.maxMp;
        let w = new Writer();
        w.uint8(11).uint16(this.id).int16(mp)
        for (let id in this.GameServer.clients) {
            let c = this.GameServer.clients[id];
            if (!c.isOnViewPort(this)) continue;
            c.sendMessage(w)
        }
    }
    reEnergy(energy) {
        energy = Math.round(energy)
        this.energy += energy
        if (this.energy > this.save.maxEnergy) this.energy = this.save.maxEnergy;
        let w = new Writer();
        w.uint8(16).uint16(this.id).int16(energy)
        for (let id in this.GameServer.clients) {
            let c = this.GameServer.clients[id];
            if (!c.isOnViewPort(this)) continue;
            c.sendMessage(w)
        }
    }
    reHp(hp, attacker) {
        hp = Math.round(hp)
        this.hp += hp
        if (this.hp > this.maxHp) this.hp = this.maxHp;
        let w = new Writer().uint8(10).uint16(this.id).uint16(attacker.id).int32(hp);
        for (let id in this.GameServer.clients) {
            let c = this.GameServer.clients[id];
            if (!c.isOnViewPort(this)) continue;
            c.sendMessage(w)
        }
    }
    spawnEntity() {
        if (this.isLife) return
        this.initStatsByClass()
        this.x = rnd([0, this.GameServer.w]);
        this.y = rnd([0, this.GameServer.h]);
        let s = this.GameServer.SafeZone.size;
        this.GameServer.objects.push(this);
        this.isLife = true;
        this.spawnTime = performance.now()
    }
    move() {
        if (this.isLife && this.class == 1) {
            let timeLeft = performance.now() - this.spawnTime;
            if (timeLeft > 3000) {
                let secondsCount = Math.floor(timeLeft / 1000);
                this.spawnTime += secondsCount * 1000;
                this.reMp(!this.isCombatStatus ? secondsCount * this.save.manaRegenAtRest : secondsCount * this.save.manaRegenAtCombat)
            }
        } else if (this.isLife && this.class == 2) {
            let timeLeft = performance.now() - this.spawnTime;
            if (timeLeft > 250) {
                let secondsCount = Math.floor(timeLeft / 250);
                this.spawnTime += secondsCount * 250;
                this.reEnergy(secondsCount * this.save.energyRegen / 4)
            }
        }

        if (!this.isLife) {
            l('is not life')
            return
        }
        if (this.isCombatStatus && performance.now() - this.combatStatusStart > this.combatStatusTime) {
            this.removeCombatStatus()
        }
        let vector;
        switch (this.class) {
            case 1:
                vector = new Vector2(this, this.aim.p)
                if (vector.distance < this.radius * 1.3) {
                    this.concentrationMode = true
                    vector = new Vector2(0, 0)
                } else {
                    if (this.spell != null) this.spell.breakProcessing()
                    this.concentrationMode = false
                }
                break;
            case 2:
                vector = new Vector2(this, {
                    x: this.x + 500 * Math.cos(this.angle),
                    y: this.y + 500 * Math.sin(this.angle)
                })
                if (this.inTriangle(this.aim.p)) {
                    this.concentrationMode = true
                    vector = new Vector2(0, 0)
                } else {
                    if (this.spell != null) this.spell.breakProcessing()
                    this.concentrationMode = false
                }
                break
        }
        let old_position = { x: this.x, y: this.y }
        this.x += vector.dx / vector.distance * this.speed
        this.y += vector.dy / vector.distance * this.speed
        if (this.GameServer.isCollision) {
            for (let id in this.ws != null ? this.objectsInVision : this.GameServer.clients) {
                let c = this.ws != null ? this.objectsInVision[id] : this.GameServer.clients[id]
                if (c.type == 'spell') continue
                if (c == this || !this.isOnViewPort(c)) continue
                let tp_arr = new Vector2(this, c);
                let dx = tp_arr.dx;
                let dy = tp_arr.dy;
                let d = tp_arr.distance;
                if (d < (c.radius + this.radius)) {
                    let nx = dx / d, ny = dy / d;
                    let s = this.radius + c.radius - d;
                    this.x -= nx * s / 2;
                    this.y -= ny * s / 2;
                    c.x += nx * s / 2;
                    c.y += ny * s / 2;
                }
                c.checkBorders()
            }
        }
        this.checkBorders();
        vector = new Vector2(old_position, this);
        if (this.type != 'mob') {
            this.aim.p.x += vector.dx;
            this.aim.p.y += vector.dy;
        }
        if (this.class == 2) {
            let targetAngle = Math.atan2(this.aim.p.y - this.y, this.aim.p.x - this.x);
            let angleDiff = Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle));
            // console.log(this.aim.p.x, this.aim.p.y, this.x, this.y);
            let add = angleDiff * this.save.rotationEasing;
            if (Math.abs(add) > this.rotationSpeed) {
                add = this.getSign(angleDiff) * this.rotationSpeed;
            }
            this.angle += add;
            if (this.angle > 2 * Math.PI) this.angle -= 2 * Math.PI;
            if (this.angle < -2 * Math.PI) this.angle += 2 * Math.PI;
        }
    }
    getSign(a) {
        return a >= 0 ? 1 : -1
    }

    inTriangle(obj) {
        let arr = [];
        for (let AddAngle = 0; AddAngle < 2 * Math.PI; AddAngle += 2 * Math.PI / 3)
            arr.push([
                this.x + (this.radius * 1.2) * Math.cos(this.angle + AddAngle),
                this.y + (this.radius * 1.2) * Math.sin(this.angle + AddAngle)
            ])
        return this.getSign((arr[0][0] - obj.x) * (arr[1][1] - arr[0][1]) - (arr[1][0] - arr[0][0]) * (arr[0][1] - obj.y)) ==
            this.getSign((arr[1][0] - obj.x) * (arr[2][1] - arr[1][1]) - (arr[2][0] - arr[1][0]) * (arr[1][1] - obj.y)) ==
            this.getSign((arr[2][0] - obj.x) * (arr[0][1] - arr[2][1]) - (arr[0][0] - arr[2][0]) * (arr[2][1] - obj.y))
    }
    degree(a) {
        return a * 180 / Math.PI
    }
    inWithinSight(obj) {
        if (obj == this) return true
        let vector = new Vector2(this, obj), a = 0;
        if (obj.y < this.y) a = -Math.acos((obj.x - this.x) / vector.distance)
        else a = -2 * Math.PI + Math.acos((obj.x - this.x) / vector.distance)
        if (this.getQuarter(this.angle) == 1 && this.getQuarter(a) == 4) a += 2 * Math.PI
        if (this.getQuarter(this.angle) == 4 && this.getQuarter(a) == 1) a -= 2 * Math.PI
        return (this.angle + this.viewAngle) >= a &&
            (this.angle - this.viewAngle) <= a
    }
    isOnViewPort(target) {
        if (this.GameServer.isRadialView) {
            return new Vector2(this, target).distance < (this.isLife ? this.GameServer.viewRatio : this.GameServer.viewRatio * 2)
        }
        return this.x > target.x - (this.isLife ? this.GameServer.viewRatio : this.GameServer.viewRatio * 2) && this.x < target.x + (this.isLife ? this.GameServer.viewRatio : this.GameServer.viewRatio * 2) && this.y > target.y - (this.isLife ? this.GameServer.viewRatio : this.GameServer.viewRatio * 2) && this.y < target.y + (this.isLife ? this.GameServer.viewRatio : this.GameServer.viewRatio * 2)
    }
    calculateRequiredExperience(level) {
        const baseExperience = config.BaseExperience;
        const growthFactor = config.RequiredExperienceFactor;
        return Math.floor(baseExperience * Math.pow(growthFactor, level - 1));
    }
    levelUp(count = 1) {
        this.save.stamina += 5*count;
        this.save.maxEnergy += 5*count;
        this.save.damageRate += 0.1*count;
        this.initStatsByMainCharacteristics()
        // this.save
        let w = new Writer();
        w.uint8(18).uint16(this.id).uint8(this.class).uint16(this.maxHp).uint16(this.hp).uint8(this.save.level)
        switch (this.class) {
            case 1:
                w.uint16(this.maxMp).uint16(this.mp)
                break;
            case 2:
                w.uint16(this.save.maxEnergy).uint16(this.energy)
                break;
        }
        for (let id in this.GameServer.clients) {
            let c = this.GameServer.clients[id];
            if (c.ws !== null) {
                c.sendMessage(w);
            }
        }
    }
    addXp(xp) {
        this.save.xp += xp;
        let levelUp = 0;
        while (this.save.xp >= this.calculateRequiredExperience(this.save.level)) {
            levelUp++;
            this.save.level++;
            this.save.xp -= this.calculateRequiredExperience(this.save.level - 1);
        }
        if (this.isLife) this.sendMessage(new Writer().uint8(19).uint16(Math.ceil(this.save.xp)))

        if (levelUp !== 0) {
            this.levelUp(levelUp);
        }
    }
    async readSave(id) {
        const savePath = 'usersaves/' + (this.type == 'player' ? this.userId : 'bots') + '.json';
        if (checkFileExists(savePath)) {
            console.log('savefile exists!');
            let list = JSON.parse(await readFile(savePath));
            if (list[id] == undefined) return false;

            this.save = list[id];
            return true;
        }
        return false;
    }
    async writeSave() {
        const savePath = 'usersaves/' + (this.type == 'player' ? this.userId : 'bots') + '.json';
        if (!checkFileExists(savePath)) return;

        let list = JSON.parse(await readFile(savePath));

        if (list[this.characterId] == undefined) return;
        list[this.characterId] = this.save;
        fs.writeFile(savePath, JSON.stringify(list, null, 4), function writeJSON(err) {
            
        });
    }
    kill(killer = false) {
        if (killer) {
            let delta = this.save.level - killer.save.level;
            if (delta == 0) killer.addXp(config.BaseExperienceForKill);
            else if (delta > 0) killer.addXp(config.BaseExperienceForKill * Math.pow(1.25, delta))
            else if (delta < 0) killer.addXp(config.BaseExperienceForKill * Math.pow(0.75, Math.abs(delta)))
            killer.save.kills += 1;
        }
        if (this.isLife) deleteFromArray(this.GameServer.objects, this)
        this.isLife = false;
    }
}
class Cooldown {
    constructor(id, info) {
        this.id = id;
        this.cooldownTime = info.cooldownTime;
        this.available = false;
        this.processTime = info.processTime;
    }
    setTime(cooldownTime = null) {
        this.available = true
        this.timeout = setTimeout(() => {
            this.available = false
        }, (cooldownTime == null ? this.cooldownTime : cooldownTime))
    }
}
module.exports.Entity = Entity