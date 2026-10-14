require('dotenv').config();

const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('klip')
        .setDescription('Tworzy klip z ostatnich sekund rozmowy')
        .addIntegerOption(option =>
            option
                .setName('sekundy')
                .setDescription('Ile ostatnich sekund nagrać')
                .setRequired(true)
                .setMinValue(5)
                .setMaxValue(300)
        )
        .addStringOption(option =>
            option
                .setName('nazwa')
                .setDescription('Nazwa pliku z klipem')
                .setRequired(true)
                .setMaxLength(80)
        ),

    new SlashCommandBuilder()
        .setName('dolacz')
        .setDescription('Dołącza do Twojego kanału głosowego')
].map(command => command.toJSON());


const rest = new REST({ version: '10' })
    .setToken(process.env.DISCORD_TOKEN);

async function main() {
    try {
        console.log('Rejestruję komendy...');

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            { body: commands }
        );

        console.log('Komendy zostały zarejestrowane!');
    } catch (error) {
        console.error(error);
    }
}

main();
