const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fs = require('fs');
const path = require('path');
const { fetchPlayerInfo } = require('../utils/playerdb');
const WHITELIST_FILE = path.join(__dirname, '..', 'data', 'whitelist.json');
const whitelistPath = path.join(__dirname, '../data/whitelist.json');

if (!fs.existsSync(WHITELIST_FILE)) fs.writeFileSync(WHITELIST_FILE, '{}');

// In-memory whitelist loaded from file (userId: { username, uuid })
let whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
if (!whitelist || typeof whitelist !== 'object' || Array.isArray(whitelist)) {
  whitelist = {};
}

// Save whitelist object to file (call this after changes!)
function saveWhitelist() {
    fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));
}

// Constants for role IDs (set these in your .env or config)
const PLAYER_ROLE_ID = process.env.PLAYER_ROLE_ID || '1384831011359031327';

const { SlashCommandBuilder } = require('discord.js');
const { server } = require('../utils/exaroton-client');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage your Minecraft whitelist info')
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Update', value: 'update' },
          { name: 'Remove', value: 'remove' },
          { name: 'Show', value: 'show' }
        )
    )
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Minecraft username (required for add/update)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      // Always reload whitelist from file
      whitelist = JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8'));
      if (!whitelist || typeof whitelist !== 'object' || Array.isArray(whitelist)) {
        whitelist = {};
      }

      const action = interaction.options.getString('action');
      const uid = interaction.user.id;
      const username = interaction.options.getString('username');
      const member = await interaction.guild.members.fetch(uid).catch(() => null);
      const list = server.getPlayerList('whitelist');

      switch (action) {
        case 'add': {
          if (!username) return interaction.editReply('❌ You must provide a username.');
          if (whitelist[uid]) return interaction.editReply('❌ You already linked a username. Use `/whitelist` with action `update`.');
          if (Object.values(whitelist).some(entry => entry.username === username)) return interaction.editReply('❌ Username is already linked.');
          const player = await fetchPlayerInfo(username);
          whitelist[uid] = { username: player.username, uuid: player.uuid };
          saveWhitelist();
          await list.addEntry(player.username);
          if (member && !member.roles.cache.has(PLAYER_ROLE_ID)) {
            await member.roles.add(PLAYER_ROLE_ID).catch(() => {});
          }
          return interaction.editReply({
            embeds: [{
              title: `✅ ${player.username} whitelisted`,
              thumbnail: { url: player.avatar },
              fields: [
                { name: 'Username', value: player.username },
                { name: 'UUID', value: player.uuid }
              ],
              color: 0x00ff00
            }]
          });
        }
        case 'update': {
          if (!username) return interaction.editReply('❌ You must provide a username.');
          if (!whitelist[uid]) return interaction.editReply('❌ You are not linked yet.');
          if (Object.values(whitelist).some(entry => entry.username === username)) return interaction.editReply('❌ That username is already linked.');
          const old = whitelist[uid].username;
          const player = await fetchPlayerInfo(username);
          whitelist[uid] = { username: player.username, uuid: player.uuid };
          saveWhitelist();
          await list.deleteEntry(old);
          await list.addEntry(player.username);
          return interaction.editReply({
            embeds: [{
              title: `🔁 Updated to ${player.username}`,
              thumbnail: { url: player.avatar },
              fields: [
                { name: 'Username', value: player.username },
                { name: 'UUID', value: player.uuid }
              ],
              color: 0x00ff00
            }]
          });
        }
        case 'remove': {
          if (!whitelist[uid]) return interaction.editReply('❌ You’re not whitelisted.');
          const toDelete = whitelist[uid].username;
          delete whitelist[uid];
          saveWhitelist();
          await list.deleteEntry(toDelete);
          if (member && member.roles.cache.has(PLAYER_ROLE_ID)) {
            await member.roles.remove(PLAYER_ROLE_ID).catch(() => {});
          }
          return interaction.editReply(`🗑️ Removed \`${toDelete}\` from the whitelist.`);
        }
        case 'show': {
          const linked = whitelist[uid];
          return linked
            ? interaction.editReply(`🧍 You're linked as \`${linked.username}\` (UUID: \`${linked.uuid}\`).`)
            : interaction.editReply(`🫥 You're not linked to any username.`);
        }
        default:
          return interaction.editReply('❌ Invalid action.');
      }
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error: ' + err.message, ephemeral: true });
    }
  }
};
