const { SlashCommandBuilder } = require('discord.js');
const { Client: ExarotonClient } = require('exaroton');
const fs = require('fs');
const path = require('path');

const MOD_ROLE_ID = '1384827724434112512';
const WHITELIST_FILE = path.join(__dirname, '..', 'data', 'whitelist.json');
const exaClient = new ExarotonClient(process.env.EXAROTON_TOKEN);
const server = exaClient.server(process.env.EXAROTON_SERVER_ID);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resync')
    .setDescription('Admin only: resync roles or Exaroton whitelist')
    .addStringOption(option =>
      option.setName('target')
        .setDescription('What to resync')
        .setRequired(true)
        .addChoices(
          { name: 'Whitelist → Exaroton', value: 'whitelist' },
          { name: 'Roles → Discord', value: 'roles' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const guild = interaction.guild;
      const member = await guild.members.fetch(interaction.user.id);
      const target = interaction.options.getString('target');

      // Read whitelist.json fresh every time
      const whitelist = fs.existsSync(WHITELIST_FILE)
        ? JSON.parse(fs.readFileSync(WHITELIST_FILE))
        : {};

      if (!member.roles.cache.has(MOD_ROLE_ID)) {
        return interaction.editReply({ content: '❌ Unauthorized' });
      }

      await server.get();

      if (target === 'whitelist') {
        const list = server.getPlayerList('whitelist');
        const existing = await list.getEntries();
        if (existing.length) await list.deleteEntries(existing);
        // Only add usernames to Exaroton
        const entries = Object.values(whitelist).map(entry => entry.username);
        if (entries.length) await list.addEntries(entries);
      } else if (target === 'roles') {
        const members = await guild.members.fetch();
        const playerRoleId = process.env.PLAYER_ROLE_ID;
        if (!playerRoleId) {
          console.error('PLAYER_ROLE_ID is not set in environment variables.');
          return interaction.editReply({ content: '❌ PLAYER_ROLE_ID is not set in environment variables.' });
        }
        for (const [id] of Object.entries(whitelist)) {
          const m = members.get(id);
          if (m && !m.roles.cache.has(playerRoleId)) {
            await m.roles.add(playerRoleId).then(() => {
              console.log(`Added player role to ${m.user.tag} (${m.id})`);
            }).catch(err => {
              console.error(`Failed to add player role to ${m.user?.tag || m.id}:`, err);
            });
          }
        }
        for (const m of members.values()) {
          if (!whitelist[m.id] && m.roles.cache.has(playerRoleId)) {
            await m.roles.remove(playerRoleId).then(() => {
              console.log(`Removed player role from ${m.user.tag} (${m.id})`);
            }).catch(err => {
              console.error(`Failed to remove player role from ${m.user?.tag || m.id}:`, err);
            });
          }
        }
      }

      return interaction.editReply({ content: `✅ Resynced \`${target}\` from local file.` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  }
};
