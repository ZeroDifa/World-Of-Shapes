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
	rateDistance(ratio) {
		this.dx *= ratio;
		this.dy *= ratio;
	}
	normallize() {
		this.dx /= this.distance
		this.dy /= this.distance
		return this
	}
}