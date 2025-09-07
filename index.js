const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Client, Collection, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
const { Client: ExarotonClient } = require('exaroton');
const { registerWorldChatSync } = require('./utils/worldchat-sync');
require('dotenv').config();

const WHITELIST_FILE = path.join(__dirname, 'data', 'whitelist.json');

if (!fs.existsSync('data')) fs.mkdirSync('data');
if (!fs.existsSync(WHITELIST_FILE)) fs.writeFileSync(WHITELIST_FILE, '{}');

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent // <-- Add this line
      ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

bot.commands = new Collection();

// Load all command modules
const commandsArray = [];
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (!command || !command.data || !command.data.name) {
    console.warn(`Skipping invalid command file: ${file}`);
    continue;
  }
  bot.commands.set(command.data.name, command);
  commandsArray.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORDBOT_TOKEN);
const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);
const server = exaClient.server(process.env.EXAROTON_SERVER_ID);

bot.once('ready', async () => {
  console.log(`✅ Logged in as ${bot.user.tag}`);
  try {
    await rest.put(Routes.applicationCommands(bot.user.id), { body: commandsArray });
    console.log('📡 Slash commands registered!');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }

  // Start Minecraft <-> Discord chat sync
  registerWorldChatSync(bot);

  // Daily sync whitelist to Exaroton (12PM AEST = 2AM UTC)
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('⏰ Running automatic whitelist resync...');
      const guild = bot.guilds.cache.first();
      const whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE));
      const list = server.getPlayerList('whitelist');
      const entries = await list.getEntries();
      if (entries.length) await list.deleteEntries(entries);
      // Only add usernames to Exaroton
      const values = Object.values(whitelist).map(entry => entry.username);
      if (values.length) await list.addEntries(values);
      console.log('✅ Auto resync complete.');
    } catch (err) {
      console.error('❌ Auto resync failed:', err);
    }
  }, { timezone: 'Australia/Sydney' });
});

bot.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = bot.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, bot);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ There was an error executing this command.', ephemeral: true });
  }
});

// Track message blocks for anti-spam

bot.on('messageCreate', async (message) => {
  // ...other messageCreate logic (if any)...
});

const TARGET_PARENT_CHANNEL_ID = '1385785222246957056';
const DISCORD_MC_CHANNEL_ID = '1388385500846493747';

bot.login(process.env.DISCORDBOT_TOKEN);