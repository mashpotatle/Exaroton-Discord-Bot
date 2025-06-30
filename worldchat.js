const fs = require('fs');
const path = require('path');
const { Client: ExarotonClient } = require('exaroton');
require('dotenv').config();

const WHITELIST_FILE = path.join(__dirname, 'data', 'whitelist.json');
const DISCORD_MC_CHANNEL_ID = '1388385500846493747';
const TARGET_PARENT_CHANNEL_ID = '1385785222246957056';
const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);

// Helper: Reverse lookup from MC username to Discord userId
function getDiscordIdByMcUsername(whitelist, mcUsername) {
  return Object.entries(whitelist).find(([, entry]) => entry.username === mcUsername)?.[0] || null;
}

// Minecraft -> Discord relay
function startWorldChatRelay(bot) {
  const server = exaClient.server(process.env.EXAROTON_SERVER_ID);
  server.subscribe("console");
  server.on("console:line", async (data) => {
    const line = data.line;
    // Debug: print every new line
    console.log(`[WorldChatRelay] Console line: ${line}`);
    // Match both [Server thread/INFO] and [Async Chat Thread - #0/INFO]: <username> message
    const match = line.match(/\[.*?\] \[(?:Server thread|Async Chat Thread - #\d+)\/INFO\]: <(.+?)> (.+)/);
    if (match) {
      const mcUsername = match[1];
      const message = match[2];
      console.log(`[WorldChatRelay] Matched chat: <${mcUsername}> ${message}`);
      const whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
      const discordId = getDiscordIdByMcUsername(whitelist, mcUsername);
      let displayName = mcUsername;
      if (discordId) {
        // Try to get Discord username
        const user = await bot.users.fetch(discordId).catch(() => null);
        if (user) displayName = user.username;
      }
      const channel = await bot.channels.fetch(DISCORD_MC_CHANNEL_ID).catch(() => null);
      if (channel) {
        await channel.send(`<${displayName}> ${message}`);
        console.log(`[WorldChatRelay] Relayed to Discord: <${displayName}> ${message}`);
      } else {
        console.log('[WorldChatRelay] Could not fetch Discord channel');
      }
    }
  });
}

// Discord -> Minecraft relay
function registerWorldChatRelay(bot) {
  bot.on('messageCreate', async (message) => {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    // Check if the message is in a thread under the target channel
    if (
      message.channel.isThread?.() &&
      message.channel.parentId === TARGET_PARENT_CHANNEL_ID
    ) {
      await message.delete().catch(() => {});
      try {
        await message.author.send("Heads up! Threads in that channel are auto-moderated and sending text is forbidden.");
      } catch {}
    }

    if (message.channelId !== DISCORD_MC_CHANNEL_ID) return;

    // Load whitelist and find MC username
    const whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
    const entry = whitelist[message.author.id];
    const mcUsername = entry && entry.username;
    if (!mcUsername) {
      await message.reply({ content: '? You are not linked to a Minecraft username.', ephemeral: true });
      return;
    }

    // Format and send to Minecraft
    const text = message.content.replace(/\n|\r/g, ' ').trim();
    const sayCmd = `/tellraw @a {\"text\": \"[${mcUsername}]${text ? ' ' + text : ''}\"}`;
    try {
      await exaClient.server(process.env.EXAROTON_SERVER_ID).executeCommand(sayCmd);
    } catch (err) {
      console.error('Failed to send to Minecraft:', err);
      await message.reply({ content: '? Failed to send message to Minecraft server.', ephemeral: true });
    }
  });
  startWorldChatRelay(bot);
}

module.exports = { startWorldChatRelay, registerWorldChatRelay };