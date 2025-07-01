const fs = require('fs');
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

const MOD_ROLE_ID = process.env.MOD_ROLE_ID;
const WHITELIST_FILE = path.join(__dirname, '..', 'data', 'whitelist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('list')
    .setDescription('List all linked Minecraft usernames')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(MOD_ROLE_ID)) {
        return interaction.editReply({ content: '❌ Unauthorized', ephemeral: true });
      }

      // Load the whitelist file
      const whitelist = fs.existsSync(WHITELIST_FILE)
        ? JSON.parse(fs.readFileSync(WHITELIST_FILE))
        : {};

      const output = Object.entries(whitelist).map(
        ([userId, entry]) => `• <@${userId}> → \`${entry.username}\` (UUID: \`${entry.uuid}\`)`
      );

      await interaction.editReply({
        content: output.length ? `📋 Whitelisted Users:\n${output.join('\n')}` : '🫥 No users are linked.',
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ Error: ' + err.message, ephemeral: true });
    }
  }
};
