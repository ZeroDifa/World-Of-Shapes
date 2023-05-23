class Spell {
	constructor(owner, target, id, data=null) {
		this.owner = owner;
		this.target = target;
		this.isLife = true;
		this.id = id;
		this.info = SpellsInfo[this.id];
		this.dateCreate = performance.now()
		this.init = this.info.init != undefined ? this.info.init.bind(this) : function() {};
		this.init(data);
		this.update = this.info.update != undefined ? this.info.update.bind(this) : function() {};
		this.draw = this.info.draw != undefined ? this.info.draw.bind(this) : function() {};
		this.close = this.info.close != undefined ? this.info.close.bind(this) : function() {};
		Objects.push(this)
	}
	move() {
		this.update()
    }
	hit() {
		Objects.splice(Objects.indexOf(this), 1);
		this.isLife = false;
		this.close();
    }
}
window.SpellsInfo = {
	1: {
	    init: function() {
			l(this)
	    	let vector = new Vector2(this.owner, this.target);
	    	let _ = ((this.owner.radius)*100)/ vector.distance / 100;
	    	this.x = this.owner.x + (vector.dx * _);
	    	this.y = this.owner.y + (vector.dy * _);
			this.vector = new Vector2({x: this.x,y: this.y}, {x: this.xto, y: this.yto})
			l(this.vector)
			this.fire = new Fire(15, 30, this, 1, 0, 150, 255, 5, false, function () {
	    		this.particles.push({
	    			x: this.owner.x + rnd([-this.range, this.range]), 
                	y: this.owner.y + rnd([-this.range, this.range]),
	    			tx: ((-(this.owner.vector.dx/this.owner.vector.distance)*10)/10 + rnd([-100, 100])/100)*this.speed, 
	    			ty: ((-(this.owner.vector.dy/this.owner.vector.distance)*10)/10 + rnd([-100, 100])/100)*this.speed,
	    			life: 0
	    		})
	    	});
			this.dateCreate = performance.now()
	    },
    	update: function () {
    		let vector = new Vector2(this, this.target);
			this.vector = new Vector2({x: this.x,y: this.y}, {x: this.target.x, y: this.target.y})
			this.x += vector.dx/vector.distance*6.5;
    		this.y += vector.dy/vector.distance*6.5;
    		if (vector.distance < this.target.radius || !this.target.isLife || (performance.now()-this.dateCreate > 10000 && !focus)) {
    			// new Vanish(this, 0.01)
				this.fire.destroy()
    			this.hit()
    		}
    	},
	},
	4: {
	    init: function(data) {
			this.target = {};
			this.radius = 8;
			this.x = data.int16();
			this.y = data.int16();
			this.xto = this.x
			this.yto = this.y
			this.id = data.uint16()
			this.vector = new Vector2({x: this.x,y: this.y}, {x: NaN, y: NaN})
			this.fire = new Fire(10, 300, this, 1, 100, 250, 255, 5, false);
			this.fire2 = new Fire(10, 300, this, 1, 100, 250, 255, 5, false);
			POV[this.id] = this;
	    },
    	update: function () {
			this.x += (this.xto - this.x)*0.2
			this.y += (this.yto - this.y)*0.2
			if (new Vector2(this, {x: this.xto, y: this.yto}).distance < 0.1 && performance.now()-this.dateCreate > 1000) {
				this.fire.destroy()
				this.fire2.destroy()
    			this.hit()
			}
    	},
		draw: function() {
			draw_circle(this.x, this.y, this.radius, 'red')
		},
		close: function() {
			this.fire.destroy()
			this.fire2.destroy()
			delete POV[this.id]
		}
	},
	5: {
	    init: function(data) {
			this.target = {};
			this.radius = 8;
			this.x = data.int16();
			this.y = data.int16();
			this.xto = this.x
			this.yto = this.y
			this.id = data.uint16()
			POV[this.id] = this;
	    },
    	update: function () {
			this.x += (this.xto - this.x)*0.2
			this.y += (this.yto - this.y)*0.2
    	},
		draw: function() {
			draw_circle(this.x, this.y, this.radius, 'blue')
		},
		close: function() {
			delete POV[this.id]
		}
	},
	7: {
	    init: function(data) {
			this.target = {};
			this.radius = 8;
			let c = data.uint8()
			this.bullets = {}
			for (let i = 0; i<c; i++) {
				let id = data.uint16(),
				x = data.uint16(),
				y = data.uint16();
				this.bullets[id] = {
					owner: this,
					id: id,
					x: x,
					y: y,
					xto: x,
					yto: y,
					move: function() {},
					draw: function() {},
					hit: function() {
						delete this.owner.bullets[this.id]
						delete POV[this.id]
					},
				}
				POV[id] = this.bullets[id]
			}
	    },
    	update: function () {
			for (const id in this.bullets) {
				let b = this.bullets[id]
				b.x += (b.xto - b.x)*0.2
				b.y += (b.yto - b.y)*0.2
			}
			
    	},
		draw: function() {
			for (const id in this.bullets) {
				let b = this.bullets[id]
				draw_circle(b.x, b.y, this.radius, 'red')
			}
		},
		close: function() {
			delete POV[this.id]
		}
	},
}

