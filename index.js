
require('dotenv').config();

const { AttachmentBuilder } = require('discord.js');

const {
    Client,
    GatewayIntentBits,
    Events
} = require('discord.js');

const {
    joinVoiceChannel,
    entersState,
    VoiceConnectionStatus,
    EndBehaviorType
} = require('@discordjs/voice');

const prism = require('prism-media');
const fs = require('node:fs');
const path = require('node:path');

const AudioRecorder = require('./audio-recorder');

const audioRecorder = new AudioRecorder();
audioRecorder.start();

const { spawn } = require('node:child_process');
const ffmpegPath = require('ffmpeg-static');

setInterval(() => {
    console.log(
        `Bufor audio: ${audioRecorder.durationSeconds.toFixed(1)} s`
    );
}, 5000);

const AudioFrameSplitter = require('./audio-frame-splitter');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.once(Events.ClientReady, () => {
    console.log(`Bot uruchomiony jako ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
   
    if (interaction.commandName === 'klip') {
        const sekundy = interaction.options.getInteger('sekundy');
        const nazwa = interaction.options.getString('nazwa') || 'klip';

        const bezpiecznaNazwa = nazwa
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'klip';

        if (audioRecorder.durationSeconds < 5) {
            await interaction.reply({
                content: 'Bufor nie ma jeszcze 5 sekund danych.',
                ephemeral: true
            });
            return;
        }

        const kanalId = process.env.CLIP_CHANNEL_ID;
        const kanal = await client.channels.fetch(kanalId).catch(() => null);

        if (!kanal || !kanal.isTextBased() || !kanal.send) {
            await interaction.reply({
                content: 'Nie mogę znaleźć kanału docelowego albo nie mogę wysyłać na niego wiadomości.',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: true });

        const dane = audioRecorder.getLast(sekundy);

        const folder = path.join(__dirname, 'temp');
        fs.mkdirSync(folder, { recursive: true });

        const plikPcm = path.join(folder, `klip-${Date.now()}.pcm`);
        const plikWav = plikPcm.replace(/\.pcm$/i, '.wav');

        try {
            fs.writeFileSync(plikPcm, dane);

            await new Promise((resolve, reject) => {
                const ffmpeg = spawn(ffmpegPath, [
                    '-y',
                    '-f', 's16le',
                    '-ar', '48000',
                    '-ac', '2',
                    '-i', plikPcm,
                    '-c:a', 'pcm_s16le',
                    plikWav
                ]);

                let errorOutput = '';

                ffmpeg.stderr.on('data', chunk => {
                    errorOutput += chunk.toString();
                });

                ffmpeg.on('error', reject);

                ffmpeg.on('close', code => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(
                            `FFmpeg zakończył działanie kodem ${code}: ${errorOutput}`
                        ));
                    }
                });
            });

            await kanal.send({
                content: `🎙️ Klip z ostatnich ${sekundy} sekund.`,
                files: [
                    new AttachmentBuilder(plikWav, {
                        name: `${bezpiecznaNazwa}.wav`
                    })
                ]
            });

            await interaction.editReply({
                content: `Gotowe! Klip WAV został wysłany na kanał <#${kanalId}>.`
            });
        } catch (error) {
            console.error('Błąd tworzenia klipu WAV:', error);

            await interaction.editReply({
                content: 'Nie udało się utworzyć lub wysłać klipu WAV. Szczegóły znajdziesz w konsoli.'
            });
        } finally {
            if (fs.existsSync(plikPcm)) {
                fs.unlinkSync(plikPcm);
            }

            if (fs.existsSync(plikWav)) {
                fs.unlinkSync(plikWav);
            }
        }
    }



    if (interaction.commandName === 'dolacz') {
        const kanal = interaction.member.voice.channel;

        if (!kanal) {
            await interaction.reply({
                content: 'Najpierw wejdź na kanał głosowy!',
                ephemeral: true
            });
            return;
        }

        try {
            const polaczenie = joinVoiceChannel({
                channelId: kanal.id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false
            });

            await entersState(
                polaczenie,
                VoiceConnectionStatus.Ready,
                15_000
            );

            const aktywniUzytkownicy = new Set();
            
            polaczenie.receiver.speaking.on('start', userId => {
                if (aktywniUzytkownicy.has(userId)) return;
                aktywniUzytkownicy.add(userId);

                console.log(`Wykryto mowę użytkownika: ${userId}`);

                const audioStream = polaczenie.receiver.subscribe(userId, {
                    end: {
                        behavior: EndBehaviorType.AfterSilence,
                        duration: 1000
                    }
                });

                const decoder = new prism.opus.Decoder({
                    rate: 48000,
                    channels: 2,
                    frameSize: 960
                });

                const splitter = new AudioFrameSplitter();

                audioStream
                    .pipe(decoder)
                    .pipe(splitter);

                let frameCount = 0;

                splitter.on('data', frame => {
                    try {
                        audioRecorder.addAudio(userId, frame);
                        frameCount++;

                        if (frameCount % 50 === 0) {
                            console.log(
                                `Użytkownik ${userId}: odebrano ${frameCount} ramek audio`
                            );
                        }
                    } catch (error) {
                        console.error('Błąd dodawania audio:', error);
                    }
                });

                audioStream.on('error', error => {
                    console.error('Błąd odbioru audio:', error);
                });

                audioStream.on('end', () => {
                    aktywniUzytkownicy.delete(userId);
                });

                decoder.on('error', error => {
                    console.warn('Pominięto błędny pakiet audio:', error.message);
                });

                splitter.on('error', error => {
                    console.error('Błąd dzielenia ramek:', error);
                });
            });

            await interaction.reply({
                content: `🔊 Dołączono do kanału **${kanal.name}**!`,
                ephemeral: true
            });
        } catch (error) {
            console.error('Błąd połączenia głosowego:', error);

            await interaction.reply({
                content: 'Nie udało się połączyć z kanałem głosowym.',
                ephemeral: true
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
