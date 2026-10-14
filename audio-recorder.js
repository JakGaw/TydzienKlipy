
const AudioMixer = require('./audio-mixer');
const { AudioBuffer } = require('./audio-buffer');

class AudioRecorder {
    constructor() {
        this.mixer = new AudioMixer();
        this.buffer = new AudioBuffer();
        this.timer = null;
        this.lastTick = null;
        this.accumulatedTime = 0;
        this.frameCounts = new Map();
    }

    start() {
        if (this.timer) return;

        this.lastTick = process.hrtime.bigint();
        this.accumulatedTime = 0;

        this.timer = setInterval(() => {
            const now = process.hrtime.bigint();

            const elapsed =
                Number(now - this.lastTick) / 1e6;

            this.lastTick = now;
            this.accumulatedTime += elapsed;

            
        while (this.accumulatedTime >= 20) {
            const frame = this.mixer.mix();

            // Zapisujemy ramkę tylko wtedy, gdy zawiera dźwięk.
            let hasAudio = false;

            for (let offset = 0; offset < frame.length; offset += 2) {
                if (frame.readInt16LE(offset) !== 0) {
                    hasAudio = true;
                    break;
                }
            }

    if (hasAudio) {
        this.buffer.addFrame(frame);
    }

    this.accumulatedTime -= 20;
}

        }, 5);

        console.log('Zegar nagrywania uruchomiony.');
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    addAudio(userId, frame) {
        this.mixer.addSource(userId, frame);

        const count =
            (this.frameCounts.get(userId) || 0) + 1;

        this.frameCounts.set(userId, count);

        if (count % 100 === 0) {
            console.log(
                `Rejestrator: użytkownik ${userId}, ramki ${count}`
            );
        }
    }

    getLast(seconds) {
        return this.buffer.getLast(seconds);
    }

    get durationSeconds() {
        return this.buffer.durationSeconds;
    }
}

module.exports = AudioRecorder;
