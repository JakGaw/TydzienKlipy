
const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BYTES_PER_SAMPLE = 2;

// Jeden fragment audio ma 20 ms.
const FRAME_MS = 20;
const FRAME_SAMPLES = SAMPLE_RATE * FRAME_MS / 1000;
const FRAME_BYTES = FRAME_SAMPLES * CHANNELS * BYTES_PER_SAMPLE;

const BUFFER_SECONDS = 5 * 60;
const MAX_FRAMES = BUFFER_SECONDS * 1000 / FRAME_MS;

class AudioBuffer {
    constructor() {
        this.frames = [];
    }

    addFrame(pcm) {
        if (pcm.length !== FRAME_BYTES) {
            throw new Error('Nieprawidłowy rozmiar fragmentu PCM');
        }

        this.frames.push(Buffer.from(pcm));

        if (this.frames.length > MAX_FRAMES) {
            this.frames.shift();
        }
    }

    getLast(seconds) {
        const count = Math.min(
            Math.ceil(seconds * 1000 / FRAME_MS),
            this.frames.length
        );

        return Buffer.concat(this.frames.slice(-count));
    }

    get durationSeconds() {
        return this.frames.length * FRAME_MS / 1000;
    }
}

module.exports = {
    AudioBuffer,
    SAMPLE_RATE,
    CHANNELS,
    FRAME_MS,
    FRAME_BYTES
};
