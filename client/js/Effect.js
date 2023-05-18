class Effect {
	constructor(id, owner, duration) {
		// console.log(owner, id)
		this.owner = owner;
		this.owner.Effects.push(this);
		this.id = id;
		this.duration = duration;
		this.info = Effects_animations[this.id];
		this.image = ImageCache[`${this.info.image}.png`]
		this.dateCreate = performance.now()
        this.time = this.duration-(performance.now()-this.dateCreate)
		this.init = this.info.init != undefined ? this.info.init.bind(this) : function() {};
		this.init();
		this.update = this.info.update != undefined ? this.info.update.bind(this) : function() {};
		this.draw = this.info.draw != undefined ? this.info.draw.bind(this) : function() {};
		this.close = this.info.close != undefined ? this.info.close.bind(this) : function() {};
		this.lastTime = (this.duration/1000).toFixed(1)
		Objects.push(this)
	}
	move() {
		if (!this.owner.isLife) {
			this.hit()
			return
		}
        this.time = this.duration-(performance.now()-this.dateCreate)
        this.update()
        if (this.time < 0 || (performance.now()-this.dateCreate) > this.duration) this.hit()
    }
	hit() {
		Objects.splice(Objects.indexOf(this), 1)
		this.owner.Effects.splice(this.owner.Effects.indexOf(this), 1)
		this.close()
    }
}

Effects_animations = {
	1: {
		image: 'firewave',
		title: 'Нанесение 3 урона раз в пол секунды',
		init: function() {
			let count = 0;
			for (let i = 0; i < this.owner.Effects.length; i++) {
				let e = this.owner.Effects[i];
				if (e.id == this.id && e != this) {
					this.fire = e.fire;
					return
				}
			}
			this.fire = new Fire(10, 50, this.owner, 0.6, 0, 94, 252, range=15)
	    },
    	close: function() {
			for (let i = 0; i < this.owner.Effects.length; i++) {
				if (this.owner.Effects[i].id == this.id) return
			}
			this.fire.destroy()	
    	}
	},
	3: {
		image: 'redstorm',
		title: 'Нанесение 3-9 урона раз в пол секунды и отхил 1-5',
		draw: function () {
			// ctx.shadowBlur = 40;
			ctx.shadowColor = "red";
			let old = ctx.lineWidth
			ctx.lineWidth = 5;
			draw_circle(this.owner.x, this.owner.y, this.owner.radius*5, 'transparent', true, 'red')
			ctx.shadowBlur = 0
			ctx.lineWidth = old;
		},
		close() {
			new Vanish(this, 0.1)
		}
	},
	4: {
		image: 'greenwave',
		title: 'Лечение',
	},
	5: {
		image: 'deceleration',
		title: 'замедление противника',
	},
	6: {
		image: 'invisibility',
		title: 'замедление противника',
	},
	7: {
		image: 'greenwave',
		title: 'Лечение',
	},
	2: {
		image: 'speed',
		title: 'повышение скорости на 250%',
		init: function () {
			this.points = [[],[],[]];
			this.color = 'blue';
			this.c = 0
		},
		update: function () {
			this.c++
			let text = (this.time/1000);
			if (text.toFixed(2) != this.lastTime) {
				for (let points of this.points) {
					points.unshift({
						x: this.owner.x + rnd([-6, 6]),
						y: this.owner.y + rnd([-6, 6]),
					})
					if (points.length > 0) {
						let p = points.slice(-1)[0]
						for (let i = 0; i < 1*this.c%2; i++) {
							new Particle({
								x: p.x, y: p.y, targetRadius: 50,
								color: `rgba(150, 0, ${rnd([100,255])}, ${1})`, radius: rnd([20, 100])/10
							})
						}
						points.splice(0, 1)
					}
				}

			}
			this.lastTime = text.toFixed(2)
		},
		draw: function () {
			for (let points of this.points) {
				if (points.length == 0) return
				ctx.strokeStyle = this.color
				ctx.shadowBlur = 20;
				ctx.shadowColor = this.color;
				ctx.beginPath()
				ctx.stroke()
				ctx.shadowBlur = 0;
			}
		},
		close() {
			new Vanish(this)
		}
	}
}