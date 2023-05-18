class Point {
	constructor(x,y, g) {
		this.GameServer = g;
		this.x = x;
		this.y = y;
		this.checkBorders = checkBorders.bind(this)
	}
}
module.exports.Point = Point
