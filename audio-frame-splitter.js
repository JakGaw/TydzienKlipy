
const { Transform } = require('node:stream');
const { FRAME_BYTES } = require('./audio-buffer');

class AudioFrameSplitter extends Transform {
    constructor() {
        super();
        this.pending = Buffer.alloc(0);
    }

    _transform(chunk, encoding, callback) {
        this.pending = Buffer.concat([this.pending, chunk]);

        while (this.pending.length >= FRAME_BYTES) {
            const frame = this.pending.subarray(0, FRAME_BYTES);
            this.push(frame);
            this.pending = this.pending.subarray(FRAME_BYTES);
        }

        callback();
    }
}

module.exports = AudioFrameSplitter;
