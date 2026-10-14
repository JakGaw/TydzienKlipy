
const { FRAME_BYTES } = require('./audio-buffer');

class AudioMixer {
    constructor() {
        this.sources = new Map();
    }

    addSource(userId, pcmFrame) {
        if (pcmFrame.length !== FRAME_BYTES) {
            throw new Error('Nieprawidłowy rozmiar ramki PCM');
        }

        if (!this.sources.has(userId)) {
            this.sources.set(userId, []);
        }

        const queue = this.sources.get(userId);
        queue.push(Buffer.from(pcmFrame));

        const MAX_QUEUED_FRAMES = 250;

        if (queue.length > MAX_QUEUED_FRAMES) {
            queue.splice(0, queue.length - MAX_QUEUED_FRAMES);
        }
    }

    removeSource(userId) {
        this.sources.delete(userId);
    }

    mix() {
        const output = Buffer.alloc(FRAME_BYTES);
        const frames = [];

        // Pobieramy jedną ramkę z każdej niepustej kolejki.
        for (const queue of this.sources.values()) {
            if (queue.length > 0) {
                frames.push(queue.shift());
            }
        }

        if (frames.length === 0) {
            return output;
        }

        // Łączymy próbki i ograniczamy ryzyko przesterowania.
        for (let offset = 0; offset < FRAME_BYTES; offset += 2) {
            let sum = 0;

            for (const frame of frames) {
                sum += frame.readInt16LE(offset);
            }

            const sample = Math.round(
                sum / Math.sqrt(frames.length)
            );

            output.writeInt16LE(
                Math.max(-32768, Math.min(32767, sample)),
                offset
            );
        }

        return output;
    }
}

module.exports = AudioMixer;
