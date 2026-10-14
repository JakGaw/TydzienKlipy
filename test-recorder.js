
const AudioRecorder = require('./audio-recorder');
const { FRAME_BYTES } = require('./audio-buffer');

const recorder = new AudioRecorder();

recorder.start();

setTimeout(() => {
    recorder.stop();

    console.log('Czas nagrania:', recorder.durationSeconds, 'sekund');
    console.log(
        'Rozmiar ostatnich 2 sekund:',
        recorder.getLast(2).length,
        'bajtów'
    );
}, 2000);
