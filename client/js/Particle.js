class Particle {
	constructor(info) {
		this.x = info.x != undefined ? info.x : 0;
		this.y = info.y != undefined ? info.y : 0;
		this.target = info.target == undefined ? {
			x: info.xto != undefined ? info.xto : this.x+rnd([-50, 50]),
			y: info.yto != undefined ? info.yto : this.y+rnd([-50, 50])
		} : info.target;
		this.targetRadius = info.targetRadius != undefined ? info.targetRadius : 0;
		if (this.targetRadius != 0) {
			let angle = Math.random()*Math.PI*2;
			this.target = {
				x: this.x+Math.cos(angle)*rnd([1,this.targetRadius]),
				y: this.y+Math.sin(angle)*rnd([1,this.targetRadius])
			}
		}
		this.easing = info.easing != undefined ? info.easing : 0.06;
		this.color = info.color != undefined ? info.color : 'red';
		this.radius = info.radius != undefined ? info.radius : rnd([1,6]);
		Objects.push(this)
        this.dateCreate = performance.now()
	}
	draw() {
		ctx.globalCompositeOperation = 'xor'
        draw_circle(this.x, this.y, this.radius, this.color)
		ctx.globalCompositeOperation = 'source-over'
    }
    hit() {
    	new Vanish(this, 0.05)
		Objects.splice(Objects.indexOf(this), 1)
    }
    move() {
        let vector = new Vector2(this, this.target)
        this.x += vector.dx * this.easing;
        this.y += vector.dy * this.easing;
        if (vector.distance < 3 || performance.now()-this.dateCreate > 10000) this.hit()
    }
}
// 