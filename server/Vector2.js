class Vector2 {
	constructor(f, s) {
		if (typeof f === "number" && typeof s === "number") {
			this.dx = 0;
			this.dy = 0;
			this.distance = Math.sqrt(this.dx*this.dx + this.dy*this.dy) || 1;
			return
		}
		this.dx = s.x-f.x
		this.dy = s.y-f.y
		this.distance = Math.sqrt(this.dx*this.dx + this.dy*this.dy)
	}
	reCalc(distance) {
		if (this.distance < distance) return
		this.dx *= this.distance/distance
		this.dy *= this.distance/distance
		this.distance = Math.sqrt(this.dx*this.dx + this.dy*this.dy)
	}
	normallize() {
		this.dx /= this.distance
		this.dy /= this.distance
		return this
	}
}
module.exports.Vector2 = Vector2