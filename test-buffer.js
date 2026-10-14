
const {
    AudioBuffer,
    FRAME_BYTES
} = require('./audio-buffer');

const buffer = new AudioBuffer();

// Symulujemy 10 sekund audio.
for (let i = 0; i < 500; i++) {
    const frame = Buffer.alloc(FRAME_BYTES);
    frame.writeInt16LE(i % 32768, 0);
    buffer.addFrame(frame);
}

console.log('Długość bufora:', buffer.durationSeconds, 'sekund');

const ostatnie2s = buffer.getLast(2);

console.log('Rozmiar ostatnich 2 sekund:', ostatnie2s.length, 'bajtów');
console.log('Oczekiwany rozmiar:', 48000 * 2 * 2 * 2, 'bajtów');
