
const fs = require('node:fs');
const { spawn } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');

const wejscie = process.argv[2];

if (!wejscie) {
    console.log('Użycie: node konwertuj.js audio-123.pcm');
    process.exit(1);
}

const wyjscie = wejscie.replace(/\.pcm$/i, '.wav');

const ffmpeg = spawn(ffmpegPath, [
    '-y',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    '-i', wejscie,
    wyjscie
]);

ffmpeg.stderr.on('data', data => {
    // FFmpeg zapisuje informacje diagnostyczne do stderr.
});

ffmpeg.on('close', code => {
    if (code === 0) {
        console.log(`Gotowe! Plik WAV: ${wyjscie}`);
    } else {
        console.error(`FFmpeg zakończył działanie z kodem ${code}`);
    }
});
