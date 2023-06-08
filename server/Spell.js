const { Vector2 } = require("./Vector2");

class Spell {
	constructor(id, owner, target = null) {
		this.GameServer = owner.GameServer;
		this.owner = owner;
        this.dateCreate = performance.now();
		this.spell_id = id;
        this.info = SpellsInfo[this.spell_id];
		this.target = target == null ? this.owner : target;
		if (!this.info.isAttackSpell) {
			this.target = this.owner
		}
		if (this.info.isHeal) {
			this.target = target == null ? this.owner : target;
		}
		this.type = 'spell';
		switch (this.owner.class) {
			case 1:
        		this.isBreak =  this.owner.CheckSpell('global') || this.owner.CheckSpell(this.spell_id) || (this.info.isAttackSpell && this.owner.target == null) || (!this.target.isLife) || (!this.owner.isLife) ||
        						(!this.owner.concentrationMode && this.info.isConcentration) || (this.owner.mp-this.mpCost < 0) ||
        						this.owner.CheckSpell(this.spell_id) || !this.owner.save.AllowSpells.includes(this.spell_id) || this.owner.spell != null ||
        						this.owner.mp-this.info.calculateMp(this.owner) < 0;
				break
			case 2:
        		this.isBreak =  this.owner.CheckSpell('global') || this.owner.CheckSpell(this.spell_id) || !this.owner.save.AllowSpells.includes(this.spell_id) ||
								(this.info.isAttackSpell && this.owner.target == null) || 
								(!this.target.isLife) || (!this.owner.isLife) || 
								(this.owner.energy - this.info.calculateEnergy() < 0) || !this.owner.inWithinSight(this.target)
				break
		}
        
        //init spell 
        this.init = this.info.init != undefined ? this.info.init.bind(this) : function() {};
		
		if (this.isBreak || this.init()) {
        	return
		}
		this.sendProcess()
		this.update = this.info.update != undefined ? this.info.update.bind(this) : function() {};
		this.close = this.info.close != undefined ? this.info.close.bind(this) : function() {};
		
	}
	sendProcess() {
		// if (this.owner.spell != null) return
        this.owner.sendMessage(new Writer().uint8(5).uint16(this.owner.id)
        .uint8(this.spell_id).uint16(this.owner.cooldowns[this.spell_id].processTime));
    	this.owner.spell = this
        this.setProcessing();
    }
    setCooldown() {
    	this.owner.setSpellCooldown('global');
    	this.owner.setSpellCooldown(this.spell_id);
		switch (this.owner.class) {
			case 1:
				this.owner.reMp(-this.info.calculateMp(this.owner));
				break;
			case 2:
				this.owner.reEnergy(-this.info.calculateEnergy());
				break
		}

    	this.owner.sendMessage(new Writer().uint8(8).uint8(this.spell_id).uint16(this.owner.cooldowns[this.spell_id].cooldownTime))
	}
	isNotOwnTarget() {
		return this.target.isLife && !this.owner.isOnViewPort(this.target)
	}
    setProcessing() {
    	if (this.info.processTime == 0 && !this.info.isSendSpell) {
    		this.owner.spell = null
			this.setCooldown()
    		return
    	}
    	this.processing = setTimeout(() => {
    		if (this.owner.spell == null || this.isNotOwnTarget()) {
    			this.breakProcessing()
    			return
    		}
			this.owner.spell = null
			//message 
			let w = new Writer();
			w.uint8(7).uint16(this.owner.id).uint8(this.spell_id);
			if (SpellsInfo.updatableObjects.includes(this.spell_id) && this.spell_id != 7) {
				w.int16(Math.round(this.x))
				.int16(Math.round(this.y))
				.uint16(this.id)
			   this.GameServer.objects.push(this)
			} else if (this.spell_id == 7) {
				w.uint8(this.bullets.length)
				for (const b of this.bullets) {
					w.uint16(b.id).int16(Math.round(b.x))
					 .int16(Math.round(b.y))
				}
				this.GameServer.objects.push(this)
			} else {
				w.uint16(this.target.id);
			}
    		for (let id in this.GameServer.clients) {
    			let c = this.GameServer.clients[id];
    			if (!c.isOnViewPort(this.owner) || this.isNotOwnTarget() || c.ws == null) continue;
				if (SpellsInfo.updatableObjects.includes(this.spell_id) && this.spell_id != 7) {
					c.objectsInVision[this.id] = this; 
				} else if (this.spell_id == 7) {
					for (const b of this.bullets) {
						c.objectsInVision[b.id] = b
					}
				}
				// this.GameServer.stop()
				c.sendMessage(w)
    		}
			if (this.info.isObj) this.GameServer.updateList.push(this)
    		this.setCooldown()
    	}, this.owner.cooldowns[this.spell_id].processTime)
    }
    breakProcessing() {
    	if (this.info.processTime == 0) return
    	this.owner.spell = null
    	clearTimeout(this.processing)
    	this.owner.sendMessage(new Writer().uint8(9))
    }
	sendDelete() {
		deleteFromArray(this.GameServer.objects, this)
		let w = new Writer().uint8(17).uint16(this.id)
		for (let id in this.GameServer.clients) {
			let c = this.GameServer.clients[id];
			delete c.objectsInVision[this.id];
			if (!c.isOnViewPort(this.owner)) continue;
			c.sendMessage(w);
		}
	}
	hit() {
		deleteFromArray(this.GameServer.updateList, this)
        this.close()
    }
}
let SpellsInfo = {
	'global': {
		1: {
			cooldownTime: 1000
		},
		2: {
			cooldownTime: 500
		}
	},
	updatableObjects: [
		4, 5, 7
	],
	// CLASS 1
	1: {
	    cooldownTime: 0,
	    processTime: 1500,
	    isAttackSpell: true,
		isSendSpell: true,
	    isConcentration: true,
	    isObj: true,
	    calculateMp: function(owner) {
	    	return owner.maxMp*0.05
	    },
	    init: function() {
			this.radius = 30;
			let vector = new Vector2(this.owner, this.target);
			let _ = ((this.owner.radius)*100)/ vector.distance / 100;
			this.x = this.owner.x + (vector.dx * _);
			this.y = this.owner.y + (vector.dy * _);
			this.nativeDamage = rnd([100, 150]);
			if (this.owner.name == 'олег') {
				this.nativeDamage = rnd([30000, 40000]);
			}
			// return new Vector2(this.)
	    },
	    update: function() {
			if (!this.target.isLife) {
				this.hit()
				return
			}
			let vector = new Vector2(this, this.target)
			this.x += vector.dx/vector.distance*8.5;
			this.y += vector.dy/vector.distance*8.5;
			if (vector.distance < this.target.radius) {
				this.hit()
				this.owner.setCombatStatus(8000)
			}
	    },
		close: function() {
			this.target.doDamage(-this.owner.calculateDmg(this.nativeDamage), this.owner);
			// Effs
			this.target.setCombatStatus(5000)
			new Effect(
				function () {},
				function () {},
				this.owner, this.target, 2000, 1, 1000,
				function () {
					this.target.doDamage(rnd([-20, -10]), this.owner)
				}
			);
			for (let i of this.owner.Effects) {
				if (i.effect_id == 3) return
			}
			if (rnd([0, 1000]) <= 15) {
				new Effect(
				function () {},
				function () {},
				this.owner, this.owner, 1500, 3, 500,
				function () {
					for (let id in this.GameServer.clients) {
						let obj = this.GameServer.clients[id]
						if ((new Vector2(this.owner, obj)).distance > this.owner.radius*5-obj.radius || obj == this.owner || obj.type == 'spell' || !obj.isLife) continue
						obj.doDamage(rnd([-9, -3]), this.owner)
					}
				});
			}
		}
	},
	2: {
	    cooldownTime: 10000,
	    processTime: 0,
	    isAttackSpell: false,
		isSendSpell: false,
	    isConcentration: false,
	    isObj: false,
	    calculateMp: function(owner) {
	    	return owner.maxMp*0.1
	    },
	    init: function() {
	    	new Effect(
	    	function () {
	    		this.owner.speed *= 3.5;
			},
	    	function () {
	    		this.owner.speed = this.owner.save.speed;
				l(this.owner.x, this.target.x)
	    	},
	    	this.owner, this.target, 2000, 2)
	    }
	},
	3: {
	    cooldownTime: 30000,
	    processTime: 0,
	    isAttackSpell: false,
		isSendSpell: false,
	    isConcentration: false,
	    isObj: false,
	    // isHeal: true,
	    calculateMp: function(owner) {
	    	return owner.maxMp*0.08
	    },
	    init: function() {
	    	new Effect(
	    	function () {
	    		this.nativeHeal = Math.floor((this.target.maxHp*0.3)/5)
	    	},
	    	function () {},
	    	this.owner, this.target, 4000, 4, 500,
	    	function() {
				this.target.doDamage(this.owner.calculateDmg(this.nativeHeal), this.owner);
				this.nativeHeal *= 0.6
	    	})
	    }
	},
	// CLASS 2
	4: {
		cooldownTime: 0,
	    processTime: 0,
	    isConcentration: false,
	    isAttackSpell: false,
		isSendSpell: true,
	    isObj: false,
		calculateEnergy: function() {
			return 25
		},
		init: function() {
			this.id = this.GameServer.getUniqueIdentifier()
			this.radius = 8;
			this.speed = 50;
			this.isLife = true;
			this.target = {
				x: this.owner.x + 1700*Math.cos(this.owner.angle),
				y: this.owner.y + 1700*Math.sin(this.owner.angle)
			}
			let vector = new Vector2(this.owner, this.target);
			vector.normallize()
			this.x = this.owner.x + (vector.dx * (this.owner.radius + 30));
			this.y = this.owner.y + (vector.dy * (this.owner.radius + 30));
			this.nativeDamage = rnd([100, 125]);
			this.move = () => {
				this.update()
			}
		},
		update: function() {
			for (const id in this.GameServer.clients) {
				const pl = this.GameServer.clients[id];
				if (Object.hasOwnProperty.call(this.GameServer.clients, id) && pl.isLife) {
					if (new Vector2(this, pl).distance < pl.radius + this.radius) {
						pl.setCombatStatus(8000);
						pl.doDamage(-this.owner.calculateDmg(this.nativeDamage), this.owner);
						this.owner.setCombatStatus(8000);
						this.hit()
						return
					}
				}
			}
			let v = new Vector2(this, this.target)
			v.normallize()
			this.x += Math.abs((this.target.x - this.x)*0.9) > this.speed ? v.dx*this.speed : (this.target.x - this.x)*0.9;
			this.y += Math.abs((this.target.y - this.y)*0.9) > this.speed ? v.dy*this.speed : (this.target.y - this.y)*0.9;
			if (this.x < 0) {
				this.x = 0;
				this.target.x = -this.target.x
			} else if (this.y < 0) {
				this.y = 0;
				this.target.y = -this.target.y
			} else if (this.y > this.GameServer.h) {
				this.y = this.GameServer.h;
				this.target.y -= 2*(this.target.y-this.GameServer.h);
			} else if (this.x > this.GameServer.w) {
				this.x = this.GameServer.w;
				this.target.x -= 2*(this.target.x-this.GameServer.w);
			}
			if (new Vector2(this, this.target).distance < 3) {
				this.hit();
			}
	    },
		close: function() {
			this.isLife = false;
			this.sendDelete()
			this.GameServer.freeIDS.push(this.id)
		}
	},
	5: {
		cooldownTime: 10000,
	    processTime: 0,
	    isConcentration: false,
	    isAttackSpell: false,
		isSendSpell: true,
	    isObj: false,
		calculateEnergy: function() {
			return 40
		},
		init: function() {
			// return
			this.isLife = true;
			this.id = this.GameServer.getUniqueIdentifier()
			this.radius = 8;
			this.speed = 30;
			this.target = {
				x: this.owner.x + 600*Math.cos(this.owner.angle),
				y: this.owner.y + 600*Math.sin(this.owner.angle)
			}
			let vector = new Vector2(this.owner, this.target);
			vector.normallize()
			this.x = this.owner.x + (vector.dx * (this.owner.radius + 30));
			this.y = this.owner.y + (vector.dy * (this.owner.radius + 30));
			this.nativeDamage = rnd([50, 100]);
			this.move = () => {
				this.update()
			}
		},
		update: function() {
			// return
			for (const id in this.GameServer.clients) {
				const pl = this.GameServer.clients[id];
				if (Object.hasOwnProperty.call(this.GameServer.clients, id) && pl.isLife) {
					if (new Vector2(this, pl).distance < pl.radius + this.radius) {
						pl.setCombatStatus(8000);
						this.owner.setCombatStatus(8000);
						new Effect(
							function () {
								this.target.speed *= 0.2;
								if (this.target.class == 2) {
									this.oldR = this.target.rotationSpeed
									this.target.rotationSpeed *= 0.2
								}
							},
							function () {
								this.target.speed = this.target.save.speed;
								if (this.target.class == 2) {
									this.target.rotationSpeed = this.oldR
								}
							},
							this.owner, pl, 4000, 5
						)
						this.hit()
						return
					}
				}
			}
			let v = new Vector2(this, this.target)
			v.normallize()
			this.x += Math.abs((this.target.x - this.x)*0.9) > this.speed ? v.dx*this.speed : (this.target.x - this.x)*0.9;
			this.y += Math.abs((this.target.y - this.y)*0.9) > this.speed ? v.dy*this.speed : (this.target.y - this.y)*0.9;
			if (this.x < 0) {
				this.x = 0;
				this.target.x = -this.target.x
			} else if (this.y < 0) {
				this.y = 0;
				this.target.y = -this.target.y
			} else if (this.y > this.GameServer.h) {
				this.y = this.GameServer.h;
				this.target.y -= 2*(this.target.y-this.GameServer.h);
			} else if (this.x > this.GameServer.w) {
				this.x = this.GameServer.w;
				this.target.x -= 2*(this.target.x-this.GameServer.w);
			}
			if (new Vector2(this, this.target).distance < 3) {
				this.hit();
			}
	    },
		close: function() {
			// return
			this.isLife = false;
			this.sendDelete()
			this.GameServer.freeIDS.push(this.id)
		}
	},
	6: {
		cooldownTime: 40000,
	    processTime: 0,
	    isAttackSpell: false,
		isSendSpell: false,
	    isConcentration: false,
	    isObj: false,
		calculateEnergy: function() {
			return 50
		},
		calculateMp: function(owner) {
	    	return owner.maxMp*0.2
		},
		init: function() {
			new Effect(
				function () {
					this.oldRotationSpeed = this.target.rotationSpeed;
					this.target.speed *= 2.5;
					this.target.rotationSpeed *= 2;
					this.target.setInvisibility(this.duration);
					new Effect(
						function() {
							this.sendEffect = () => {}
						},
						function() {},
						this.owner, this.target, 8000, 7, 500,
						function() {
							this.nativeHeal = Math.floor(this.target.hp*0.15)
							this.target.doDamage(this.nativeHeal, this.owner)
						}
					)
				},
				function () {
					this.target.speed = this.target.save.speed;
					this.target.rotationSpeed = this.oldRotationSpeed;
					this.target.isInvisibility = false;
				},
				this.owner, this.owner, 10000, 6
			)
		}
	},
	7: {
		cooldownTime: 1000,
	    processTime: 0,
	    isConcentration: false,
	    isAttackSpell: false,
		isSendSpell: true,
	    isObj: false,
		calculateEnergy: function() {
			return 60
		},
		init: function() {
			this.bullets = [];
			this.targets = [];
			let maxTargets = Object.keys(this.owner.objectsInVision).length
			outher: for (let i = 0; i < (maxTargets >= 10 ? 10 : maxTargets); i++) {
				inner: for (const id in this.owner.objectsInVision) {
					if (Object.hasOwnProperty.call(this.owner.objectsInVision, id) && id != this.owner.id) {
						const player = this.owner.objectsInVision[id];
						if (this.owner.inWithinSight(player) && !this.targets.includes(player)) {
							let v = new Vector2(this.owner, player);
							v.normallize()
							this.targets.push(player)
							this.bullets.push({
								x: this.owner.x + (v.dx * (this.owner.radius + 30)),
								y: this.owner.y + (v.dy * (this.owner.radius + 30)),
								radius: 8, speed: 30,
								target: {
									x: this.owner.x + 650*v.dx,
									y: this.owner.y + 650*v.dy
								},
								type: 'spell',
								nativeDamage: rnd([30, 60]),
								id: this.GameServer.getUniqueIdentifier()
							})
							break inner

						}
						
					}
				}
			}
			this.move = () => {
				this.update()
			}
			this.deleteBullet = function(b) {
				deleteFromArray(this.bullets, b);
				this.GameServer.freeIDS.push(b.id)
				let w = new Writer().uint8(17).uint16(b.id)
				for (let id in this.GameServer.clients) {
					let c = this.GameServer.clients[id];
					delete c.objectsInVision[b.id];
					c.sendMessage(w);
				}
			}.bind(this)
			return this.bullets.length == 0
		},
		update: function() {
			for (const id in this.GameServer.clients) {
				const pl = this.GameServer.clients[id];
				if (!this.bullets.length) return
				if (Object.hasOwnProperty.call(this.GameServer.clients, id) && pl.isLife) {
					inner: for (let b of this.bullets) {
						if (new Vector2(b, pl).distance < pl.radius + b.radius) {
							pl.setCombatStatus(8000);
							this.owner.setCombatStatus(8000);
							//deleting
							this.deleteBullet(b);
							pl.doDamage(-this.owner.calculateDmg(b.nativeDamage), this.owner)
							break inner
						}
					}
				}
			}
			for (let bullet of this.bullets) {
				let v = new Vector2(bullet, bullet.target)
				v.normallize()
				bullet.x += Math.abs((bullet.target.x - bullet.x)*0.9) > bullet.speed ? v.dx*bullet.speed : (bullet.target.x - bullet.x)*0.9;
				bullet.y += Math.abs((bullet.target.y - bullet.y)*0.9) > bullet.speed ? v.dy*bullet.speed : (bullet.target.y - bullet.y)*0.9;
				if (bullet.x < 0) {
					bullet.x = 0;
					bullet.target.x = -bullet.target.x
				} else if (bullet.y < 0) {
					bullet.y = 0;
					bullet.target.y = -bullet.target.y
				} else if (bullet.y > this.GameServer.h) {
					bullet.y = this.GameServer.h;
					bullet.target.y -= 2*(bullet.target.y-this.GameServer.h);
				} else if (bullet.x > this.GameServer.w) {
					bullet.x = this.GameServer.w;
					bullet.target.x -= 2*(bullet.target.x-this.GameServer.w);
				}
				if (new Vector2(bullet, bullet.target).distance < 3) {
					this.deleteBullet(bullet)
					if (this.bullets.length == 0) {
						this.hit()
						return
					}
				}
			}

	    },
		close: function() {
			deleteFromArray(this.GameServer.objects, this);
		}
	},
}
module.exports.Spell = Spell;
module.exports.SpellsInfo = SpellsInfo;