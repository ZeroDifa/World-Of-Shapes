class Reader {
	constructor(data) {
		this.data = data
		this.offset = 0
	}
	uint8() {
		return this.data.getUint8(this.offset++)
    }
    int8() {
    	return this.data.getInt8(this.offset++)
    }
    uint16() {
    	let t = this.data.getUint16(this.offset, true)
    	this.offset += 2
    	return t
    }
    int16() {
    	let t = this.data.getInt16(this.offset, true)
    	this.offset += 2
    	return t
    }
    uint24() {
    	let t = this.data.getUint24(this.offset, true)
    	this.offset += 3
    	return t
    }
    int24() {
    	let t = this.data.getInt24(this.offset, true)
    	this.offset += 3
    	return t
    }
    uint32() {
    	let t = this.data.getUint32(this.offset, true)
    	this.offset += 4
    	return t
    }
    int32() {
    	let t = this.data.getInt32(this.offset, true)
    	this.offset += 4
    	return t
    }
    float32() {
    	let t = this.data.getFloat32(this.offset, true)
    	this.offset += 4
    	return t
    }
    float64() {
    	let t = this.data.getFloat64(this.offset, true)
    	this.offset += 8
    	return t
    }
    color() {
    	return `rgb(${this.data.getUint8(this.offset++)}, ${this.data.getUint8(this.offset++)}, ${this.data.getUint8(this.offset++)})`
    }
    string(len) {
        let s = '', conut = 0;
        let arr = []
        while (this.data.getUint16(this.offset, true) != 0) {
            let code = this.data.getUint16(this.offset).toString(16)
            this.offset += 2
            arr.push(code.slice(2) + code.slice(0, 2))
            s += String.fromCodePoint(parseInt(code.slice(2) + code.slice(0, 2), 16))
            conut++
        }
        this.offset += 2
        return s
    }
}