
const fs = require('node:fs');
const AudioRecorder = require('./audio-recorder');

const recorder = new AudioRecorder();
recorder.start();

console.log('Test trwa 5 sekund...');

setTimeout(() => {
    recorder.stop();

    const dane = recorder.getLast(5);
    fs.writeFileSync('test-klip.pcm', dane);

    console.log(`Zapisano ${dane.length} bajtów do test-klip.pcm`);
}, 5000);
