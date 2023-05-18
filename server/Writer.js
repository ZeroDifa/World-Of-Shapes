class Writer {
    constructor() {
        this.offset = 0;
        this.data = {};
        this.sharedBuf = Buffer.allocUnsafe(1048576);
    }
    uint8(a) {
        this.data[this.offset] = a
        this.sharedBuf[this.offset++] = a;
        return this
    }
    int8(a) {
        this.data[this.offset] = a
        this.sharedBuf[this.offset++] = a;
        return this
    }
    uint16(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeUInt16LE(a, this.offset);
        this.offset += 2;
        return this
    }
    int16(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeInt16LE(a, this.offset);
        this.offset += 2;
        return this
    }
    uint24(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeUIntLE(a, this.offset, 3);
        this.offset += 3;
        return this
    }
    int24(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeIntLE(a, this.offset, 3);
        this.offset += 3;
        return this
    }
    uint32(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeUInt32LE(a, this.offset);
        this.offset += 4;
        return this
    }
    int32(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeInt32LE(a, this.offset);
        this.offset += 4;
        return this
    }
    float32(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeFloatLE(a, this.offset);
        this.offset += 4;
        return this
    }
    float64(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeDoubleLE(a, this.offset);
        this.offset += 8;
        return this
    }
    ztstringucs2(a) {
        this.data[this.offset] = a
        if (a){
            const tbuf = Buffer.from(a, "ucs2");
            this.offset += tbuf.copy(this.sharedBuf, this.offset);
        }
        this.sharedBuf[this.offset++] = 0;
        this.sharedBuf[this.offset++] = 0;
        return this
    }
    ztstringutf8(a) {
        this.data[this.offset] = a
        if (a){
            const tbuf = Buffer.from(a, "utf-8");
            this.offset += tbuf.copy(this.sharedBuf, this.offset);
        }
        this.sharedBuf[this.offset++] = 0;
        return this
    }
    color(a) {
        this.data[this.offset] = a
        this.sharedBuf.writeUIntLE(((a & 0xFF) << 16) | (((a >> 8) & 0xFF) << 8) | (a >> 16), this.offset, 3);
        this.offset += 3;
        return this
    }
    bytes(a) {
        this.data[this.offset] = a
        this.offset += a.copy(this.sharedBuf, this.offset, 0, a.length);
        return this
    }
    f() {
        const a = Buffer.allocUnsafe(this.offset);
        this.sharedBuf.copy(a, 0, 0, this.offset);
        return a;
    }
}
module.exports.Writer = Writer