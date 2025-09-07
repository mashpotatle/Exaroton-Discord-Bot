const { Client: ExarotonClient } = require('exaroton');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WHITELIST_FILE = path.join(__dirname, '../data/whitelist.json');
const DISCORD_MC_CHANNEL_ID = process.env.DISCORD_MC_CHANNEL_ID;
const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);

function getDiscordIdByMcUsername(whitelist, mcUsername) {
  return Object.entries(whitelist).find(([, entry]) => entry.username === mcUsername)?.[0] || null;
}

function startWorldChatRelay(bot) {
  const server = exaClient.server(process.env.EXAROTON_SERVER_ID);
  server.subscribe('console');
  server.on('console:line', async (data) => {
    const line = data.line;
    const match = line.match(/\[.*?\] \[(?:Server thread|Async Chat Thread - #\d+)\/INFO\]: <(.+?)> (.+)/);
    if (match) {
      const mcUsername = match[1];
      const message = match[2];
      const whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
      const discordId = getDiscordIdByMcUsername(whitelist, mcUsername);
      let displayName = mcUsername;
      if (discordId) {
        const user = await bot.users.fetch(discordId).catch(() => null);
        if (user) displayName = user.username;
      }
      const channel = await bot.channels.fetch(DISCORD_MC_CHANNEL_ID).catch(() => null);
      if (channel) {
        await channel.send(`<${displayName}> ${message}`);
      }
    }
  });
}

function registerWorldChatSync(bot) {
  bot.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.channelId !== DISCORD_MC_CHANNEL_ID) return;
    const whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
    const entry = whitelist[message.author.id];
    const mcUsername = entry && entry.username;
    if (!mcUsername) {
      await message.reply({ content: '? You are not linked to a Minecraft username.', ephemeral: true });
      return;
    }
    const text = message.content.replace(/\n|\r/g, ' ').trim();
    const sayCmd = `/tellraw @a {\"text\": \"[${mcUsername}]${text ? ' ' + text : ''}\"}`;
    try {
      await exaClient.server(process.env.EXAROTON_SERVER_ID).executeCommand(sayCmd);
    } catch (err) {
      await message.reply({ content: '? Failed to send message to Minecraft server.', ephemeral: true });
    }
  });
  startWorldChatRelay(bot);
}

module.exports = { registerWorldChatSync };