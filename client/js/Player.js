class Player {
	constructor(r) {
		this.id = r.uint16();
		this.class = r.uint8();
		this.angleTo = 0
		this.angle = 0
		this.isMainPlayer = (this.id == MyID);
		this.x = r.uint16();
		this.y = r.uint16();
		this.xto = this.x;
		this.yto = this.y;
		this.vector = new Vector2({ x: this.x, y: this.y }, { x: this.xto, y: this.yto })
		this.color = r.color();
		this.radius = r.uint8();
		this.name = r.string(r.uint8());
		this.maxHp = r.uint16();
		this.hp = r.uint16();
		this.level = r.uint8();
		if (this.isMainPlayer) this.xp = r.uint16();
		// l(this.level, this.xp)
		this.opacity = 1;
		this.dateToRestoreOpacity = performance.now() - 9999999
		switch (this.class) {
			case 1:
				this.maxMp = r.uint16();
				this.mp = r.uint16();
				break;
			case 2:
				this.maxEnergy = r.uint16()
				this.energy = r.uint16();
				break
		}
		let count = r.uint8();
		this.isCircleEffects = true;
		this.Effects = [];
		for (let i = 0; i < count; i++) {
			new Effect(r.uint8(), this, r.uint16())
		}
		if (this.class == 2) {
			this.angle = r.float32();
			this.cosA = 0;
			this.sinA = 0;
			if (this.isMainPlayer) this.viewAngle = r.float32();
		}
		this.spellProcesses = {};
		this.cooldowns = {};
		this.isLife = true;
		this.nameLength = 100 + (ctx.measureText(this.name).width > 100 ? ctx.measureText(this.name).width - 100 : 0);
		if (this.isMainPlayer) {
			this.initInteface();
			this.freeze = false;
		}
	}
	setDelete(code, r) {
		switch (code) {
			case 0:
				this.isLife = false;
				if (this.hp <= 0) {
					for (let i = 0; i < 30; i++) {
						new Particle({
							x: this.x, y: this.y,
							color: ['gray', 'black', 'green'][rnd([0, 4])], radius: rnd([100, 200]) / 100
						})
					}
				}
				new Vanish(this, 0.08)
				delete POV[this.id]
				break;
			case 1:

				if (this.isMainPlayer) {
					let t = r.uint16();
					this.dateToRestoreOpacity = performance.now() + t
					this.opacity = 0.3;

				} else {
					new Vanish(this, 0.02);
					delete POV[this.id]
				}
				break;
			default:
				break;
		}

	}

	reMp(mp) {
		this.mp += mp;
		if (this.mp > this.maxMp) this.mp = this.maxMp;
		if (this.isMainPlayer) this.updateInterface();
	}
	reEnergy(energy) {
		this.energy += energy;
		if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
		if (this.isMainPlayer) this.updateInterface();
	}
	reHp(hp) {
		this.hp += hp;
		if (this.hp > this.maxHp) this.hp = this.maxHp;
		if (this.hp <= 0) this.hp = 0;
		else if (this.hp > this.maxHp) this.hp = this.maxHp;
		if (this.isMainPlayer) this.updateInterface();
	}
	breakProcess() {
		this.spellCooldownBar.style['visibility'] = 'hidden'
	}
	setSpellProcess(spell_id, time) {
		if (time < 50) return
		this.spellCooldownBar.style['visibility'] = 'visible'
		this.spellCooldownBar.style['width'] = '0%'
		this.spellProcesses[spell_id] = {
			dateStart: performance.now(),
			time: time,
			owner: this,
			spell_id: spell_id,
			update: function () {
				let processTime = (performance.now() - this.dateStart);
				if (processTime > this.time) {
					this.owner.spellCooldownBar.style['visibility'] = 'hidden'
					delete this.owner.spellProcesses[this.spell_id];
					return
				}
				this.owner.spellCooldownBar.style['width'] = ((processTime * 100) / this.time).toString() + '%'
			}
		}
	}
	setGlobalCooldown(time) {
		this.globalCooldownBar.style['visibility'] = 'visible'
		this.globalCooldownBar.style['width'] = '100%'
		this.spellProcesses['global'] = {
			dateStart: performance.now(),
			time: time,
			owner: this,
			update: function () {
				let processTime = this.time - (performance.now() - this.dateStart);
				if (processTime < 0) {
					this.owner.globalCooldownBar.style['visibility'] = 'hidden'
					delete this.owner.spellProcesses['global'];
					return
				}
				this.owner.globalCooldownBar.style['width'] = ((processTime * 100) / this.time).toString() + '%'
			}
		}
	}
	setCooldown(r) {
		let id = r.uint8()
		this.cooldowns[id] = new Cooldown(id, r.uint16(), this);
	}
	doSpell(r) {
		let spell_id = r.uint8();
		let target;
		if (UpdatableObjects.includes(spell_id)) {
			new Spell(this, null, spell_id, r)
			return
		}
		else target = r.uint16();
		if (!hasPlayer(target)) return
		new Spell(this, POV[target], spell_id)
	}
	initInteface() {
		this.bars = document.getElementsByClassName('bar-value');
		this.personInfo = document.getElementById('statsInterface');
		this.spellsInterface = document.getElementById('spells-interface');
		this.nameBar = document.getElementById('name-bar');
		this.nameBar.innerHTML = this.name
		switch (this.class) {
			case 1:
				$('#mp').css('background-color', 'rgba(0, 0, 255, 0.51)')
				break;
			case 2:
				$('#mp').css('background-color', 'rgb(255, 141, 0, 0.51)')
				break
		}
		this.updateInterface();
		this.globalCooldownBar = document.getElementById('global');
		this.spellCooldownBar = document.getElementById('spell');
		this.personInfo.style['display'] = 'block';
		this.spellsInterface.style['display'] = 'flex';
	}
	updateInterface() {
		let percent = (100 * this.hp) / this.maxHp
		this.bars[0].innerHTML = `${this.hp} / ${this.maxHp}`
		this.bars[1].innerHTML = `${percent.toFixed(1)}%`
		$('#hp').css('width', `${percent.toFixed(4)}%`)
		switch (this.class) {
			case 1:
				percent = (100 * this.mp) / this.maxMp
				this.bars[2].innerHTML = `${this.mp} / ${this.maxMp}`
				this.bars[3].innerHTML = `${percent.toFixed(1)}%`
				$('#mp').css('width', `${percent.toFixed(4)}%`)
				break;
			case 2:
				percent = (100 * this.energy) / this.maxEnergy
				this.bars[2].innerHTML = `${this.energy} / ${this.maxEnergy}`
				this.bars[3].innerHTML = `${percent.toFixed(1)}%`
				$('#mp').css('width', `${percent.toFixed(4)}%`)
				break
		}
	}
	draw() {
		if (performance.now() > this.dateToRestoreOpacity) this.opacity = 1;
		switch (this.class) {
			case 1:
				draw_circle(this.x, this.y, this.radius, this.freeze ? 'blue' : this.color)
				draw_circle(this.x, this.y, this.radius, 'transparent', true, 'black')
				break;
			case 2:
				ctx.beginPath();
				ctx.moveTo(this.x + this.radius * Math.cos(this.angle), this.y + this.radius * Math.sin(this.angle));
				for (var i = 1; i <= 2; i++) {
					var currentAngle = this.angle + (i * 2 * Math.PI / 3);
					ctx.lineTo(this.x + this.radius * Math.cos(currentAngle), this.y + this.radius * Math.sin(currentAngle));
				}
				ctx.closePath();
				ctx.fillStyle = 'red'
				ctx.fill()
				ctx.stroke();
				break
		}
		this.draw_name()
		this.drawEffects()
		if (this.class == 2) this.drawVector()
		if (!this.isMainPlayer) this.drawHpBar()
	}
	sort(arr) {
		arr.sort((a, b) => b.time - a.time);
	}
	getAimY() {
		return this.y + this.radius * Math.sin(this.angleY)
	}
	drawVector() {
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + this.radius * Math.cos(this.angle), this.y + this.radius * Math.sin(this.angle));
		ctx.stroke();
		if (!this.isMainPlayer) return

		ctx.strokeStyle = `rgb(${105}, ${88}, ${88}, 0.3)`
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + viewRatio * Math.cos(this.angle + this.viewAngle),
			this.y + viewRatio * Math.sin(this.angle + this.viewAngle));
		ctx.stroke();
		ctx.moveTo(this.x, this.y);
		ctx.lineTo(this.x + viewRatio * Math.cos(this.angle - this.viewAngle),
			this.y + viewRatio * Math.sin(this.angle - this.viewAngle));
		ctx.stroke();
	}
	drawEffects() {
		let a = 35
		let MaxCount = 5;
		MaxCount = this.Effects.length > MaxCount ? MaxCount : this.Effects.length
		this.sort(this.Effects)
		for (let i = 0; i < this.Effects.length; i++) {
			let x = this.x - ((MaxCount) / 2 * a) + ((i % MaxCount) * a),
				y = this.y - 50 - (a * Math.ceil((i + 1) / MaxCount));
			if (this.Effects[i].image == undefined) continue
			ctx.drawImage(this.Effects[i].image, x, y, a, a)
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'white';
			ctx.fillText((this.Effects[i].time / 1000).toFixed(1), x + a / 2, y + a / 2);
			if (this.Effects[i].time < 50) {
				new Vanish({
					x: this.x - ((MaxCount) / 2 * a) + ((i % MaxCount) * a), a: a,
					y: this.y - 50 - (a * Math.ceil((i + 1) / MaxCount)),
					image: this.Effects[i].image,
					draw: function () {
						this.y--
						ctx.drawImage(this.image, this.x, this.y, this.a, this.a);
						ctx.textAlign = 'center';
						ctx.textBaseline = 'middle';
						ctx.font = '17.5px Verdana'
						ctx.fillStyle = 'white';
						ctx.fillText('0.0', this.x + this.a / 2, this.y + this.a / 2);
					},
				}, 0.1);
			}
		}
	}
	drawHpBar() {
		draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 15, this.nameLength, 10, 'gray');
		ctx.strokeStyle = 'white'
		ctx.stroke()
		draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 15, this.nameLength * this.hp / this.maxHp, 10, 'red');
		draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength, 10, 'gray');
		ctx.strokeStyle = 'white'
		ctx.stroke()
		if (this.class == 1) draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength * this.mp / this.maxMp, 10, 'blue');
		if (this.class == 2) draw_rect(this.x - this.nameLength / 2, this.y - this.radius - 5, this.nameLength * this.energy / this.maxEnergy, 10, 'orange');
		ctx.beginPath()
		ctx.fillStyle = 'black';
		ctx.textAlign = 'start';
		ctx.textBaseline = "top";
		ctx.font = 10 + 'px Verdana';
		ctx.fillText(`${this.hp}/${this.maxHp}`, this.x - this.nameLength / 2, this.y - this.radius - 15);
		if (this.class == 1) ctx.fillText(`${this.mp}/${this.maxMp}`, this.x - this.nameLength / 2, this.y - this.radius - 5)
		if (this.class == 2) ctx.fillText(`${this.energy}/${this.maxEnergy}`, this.x - this.nameLength / 2, this.y - this.radius - 5)
	}
	draw_name(align = 'center', base = 'middle') {
		ctx.beginPath();
		ctx.font = this.radius * 0.5 + 'px Verdana';
		ctx.fillStyle = 'gray';
		ctx.textAlign = align;
		ctx.textBaseline = base;
		if (typeof name == "number") name = Math.floor(name);
		if (!this.isMainPlayer) {
			ctx.fillText(this.name, this.x, this.y - this.radius * 1.7);

			ctx.drawImage(ImageCache['star.png'], this.x - ctx.measureText(this.name).width / 2 - 30, this.y - this.radius - 30 * 1.5, 30, 30)

			ctx.fillText(this.level, this.x - ctx.measureText(this.name).width / 2 - 30 / 2, this.y - this.radius - 27.5);

		}
		if (this.freeze) ctx.fillText('click me!', this.x, this.y);
	}
	move() {
		this.vector = new Vector2({ x: this.x, y: this.y }, { x: this.xto, y: this.yto })
		this.x += (this.xto - this.x) * 0.2;
		this.y += (this.yto - this.y) * 0.2;
		this.angle += (this.angleTo - this.angle) * 0.99;

		for (let id in this.spellProcesses) {
			this.spellProcesses[id].update()
		}
		for (let id in this.cooldowns) {
			this.cooldowns[id].update()
		}
	}
}

class Cooldown {
	constructor(spell_id, cooldownTime, owner) {
		this.dateStart = performance.now();
		this.cooldownTime = cooldownTime;
		this.owner = owner;
		this.button = document.getElementById(spell_id);
		this.old = this.button.innerHTML
		this.button.style['filter'] = 'grayscale(100%)';
		this.spell_id = spell_id;
	}
	update() {
		let processTime = this.cooldownTime - (performance.now() - this.dateStart);
		this.button.innerHTML = (processTime / 1000).toFixed(2);
		if (processTime < 0) {
			this.button.innerHTML = this.old;
			this.button.style['filter'] = 'none'
			delete this.owner.cooldowns[this.spell_id];
			return
		}
	}
}
let Damages = [];
class Damage {
	constructor(owner, value, color) {
		this.owner = owner;
		this.value = value;
		this.color = color;
		this.align = 'center'
		this.font = 80 + (this.isCrit ? 20 : 0);
		this.radius = ctx.measureText(this.value).width / 2
		this.x = owner.x + [-this.radius * 5, this.radius * 5][rnd([0, 2])];
		this.y = owner.y;
		this.aim = {
			x: this.x,
			y: this.y - 350
		}
		Objects.push(this)
		Damages.push(this)
		this.dateCreate = performance.now()
	}
	draw() {
		ctx.beginPath();
		ctx.font = this.font + 'px Verdana';
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align
		this.radius = ctx.measureText(this.value).width / 2
		// draw_circle(this.x, this.y, this.radius, 'transparent', true, this.color)
		ctx.fillStyle = this.color
		ctx.fillText(this.value, this.x, this.y);
	}
	hit() {
		new Vanish(this, 0.1)
		Objects.splice(Objects.indexOf(this), 1)
		Damages.splice(Damages.indexOf(this), 1)
	}
	move() {
		let vector = new Vector2(this, this.aim)
		this.font -= Math.abs(this.font - 1) * 0.01;
		this.x += vector.dx * 0.02;
		this.y += vector.dy * 0.02;
		for (let c of Damages) {
			if (c == this) continue
			let tp_arr = new Vector2(this, c);
			let dx = tp_arr.dx;
			let dy = tp_arr.dy;
			let d = tp_arr.distance;
			if (d < (c.radius + this.radius)) {
				let nx = dx / d;  // Compute eigen vectors
				let ny = dy / d;
				let s = this.radius + c.radius - d;
				this.x -= nx * s / 2; // Move first object by half of collision size
				this.y -= ny * s / 2;
				c.x += nx * s / 2;  // Move other object by half of collision size in opposite direction
				c.y += ny * s / 2;
			}
		}
		if (this.font < 40 || performance.now() - this.dateCreate > 10000) this.hit()
	}
}