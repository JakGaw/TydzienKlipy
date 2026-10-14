
const AudioMixer = require('./audio-mixer');
const { FRAME_BYTES } = require('./audio-buffer');

const mixer = new AudioMixer();

const glos1 = Buffer.alloc(FRAME_BYTES);
const glos2 = Buffer.alloc(FRAME_BYTES);

// Symulujemy dwie osoby, które w tej samej chwili
// generują próbki o wartości 1000 i 2000.
for (let i = 0; i < FRAME_BYTES; i += 2) {
    glos1.writeInt16LE(1000, i);
    glos2.writeInt16LE(2000, i);
}

mixer.addSource('osoba1', glos1);
mixer.addSource('osoba2', glos2);

const wynik = mixer.mix();

console.log('Rozmiar ramki:', wynik.length, 'bajtów');
console.log('Próbka wynikowa:', wynik.readInt16LE(0));
console.log('Oczekiwana próbka: 3000');
