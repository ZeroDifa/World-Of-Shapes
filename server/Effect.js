class Effect {
	constructor(init, close, owner, target, duration, id, interval = false, intervalFunc) {
		if (!target.isLife || !owner.isLife) return

		this.timeNow = performance.now();
		this.dateCreate = performance.now();
		this.owner = owner;
		this.target = target;
		this.duration = duration;
		this.interval = interval;
		this.target.Effects.push(this)
		this.GameServer = this.owner.GameServer;
		// funcs
		this.init = init.bind(this);
		this.init();
		this.close = close.bind(this);
		if (interval !== false) {
			this.intervalFunc = intervalFunc.bind(this);
		}
		this.effect_id = id;
		this.GameServer.updateList.push(this);
		this.sendEffect();
	}
	sendEffect() {
		for (let id in this.GameServer.clients) {
			this.GameServer.clients[id].sendMessage(new Writer().uint8(12).uint16(this.target.id).uint8(this.effect_id).uint16(this.duration))
		}
	}
	get remain() {
		return performance.now()-this.dateCreate
	}
	update() {
		if (!this.target.isLife) {
			this.remove()
			return
		}
		if (this.interval !== false) {
			let timeLeft = performance.now()-this.timeNow;
			if (timeLeft > this.interval) {
				let secondsCount = Math.floor(timeLeft/this.interval);
				this.timeNow += secondsCount*this.interval;
				this.intervalFunc()
			}
		}
		if (this.remain >= this.duration) {
			this.remove()
			this.close()
		}
	}
	remove() {
		deleteFromArray(this.target.Effects, this)
		deleteFromArray(this.GameServer.updateList, this)
	}
}

module.exports.Effect = Effect;
