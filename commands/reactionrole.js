const fs = require('fs');
const path = require('path');
const { PermissionFlagsBits } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

const MOD_ROLE_ID = process.env.MOD_ROLE_ID;
const REACT_FILE = path.join(__dirname, '..', 'data', 'reactionroles.json');
if (!fs.existsSync(REACT_FILE)) fs.writeFileSync(REACT_FILE, '[]');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create a reaction role message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(opt => opt.setName('message').setDescription('Message content').setRequired(true))
    .addStringOption(opt => opt.setName('emoji1').setDescription('Emoji 1').setRequired(true))
    .addRoleOption(opt => opt.setName('role1').setDescription('Role 1').setRequired(true))
    .addStringOption(opt => opt.setName('emoji2').setDescription('Emoji 2'))
    .addRoleOption(opt => opt.setName('role2').setDescription('Role 2'))
    .addStringOption(opt => opt.setName('emoji3').setDescription('Emoji 3'))
    .addRoleOption(opt => opt.setName('role3').setDescription('Role 3'))
    .addStringOption(opt => opt.setName('emoji4').setDescription('Emoji 4'))
    .addRoleOption(opt => opt.setName('role4').setDescription('Role 4'))
    .addStringOption(opt => opt.setName('emoji5').setDescription('Emoji 5'))
    .addRoleOption(opt => opt.setName('role5').setDescription('Role 5'))
    .addStringOption(opt => opt.setName('emoji6').setDescription('Emoji 6'))
    .addRoleOption(opt => opt.setName('role6').setDescription('Role 6'))
    .addStringOption(opt => opt.setName('emoji7').setDescription('Emoji 7'))
    .addRoleOption(opt => opt.setName('role7').setDescription('Role 7')),

  async execute(interaction) {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(MOD_ROLE_ID)) {
      return interaction.reply({ content: '❌ Unauthorized', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const messageText = interaction.options.getString('message');
    const guild = interaction.guild;
    const channel = await guild.channels.fetch(interaction.channelId);

    const pairs = [];
    for (let i = 1; i <= 7; i++) {
      const emoji = interaction.options.getString(`emoji${i}`);
      const role = interaction.options.getRole(`role${i}`);
      if (emoji && role) {
        pairs.push({ emoji, role });
      }
    }

    if (!pairs.length) {
      return interaction.editReply({ content: '❌ At least one emoji-role pair is required.' });
    }

    const embed = {
      color: 0x00ffcc,
      title: 'Reaction Role',
      description: `${messageText}\n\n${pairs.map(p => `${p.emoji} → ${p.role}`).join('\n')}`
    };

    const sent = await channel.send({ embeds: [embed] });
    for (const p of pairs) {
      await sent.react(p.emoji).catch(() => {});
    }

    const stored = JSON.parse(fs.readFileSync(REACT_FILE));
    stored.push({
      guildId: guild.id,
      channelId: sent.channel.id,
      messageId: sent.id,
      roles: pairs.map(p => ({ emoji: p.emoji, roleId: p.role.id }))
    });
    fs.writeFileSync(REACT_FILE, JSON.stringify(stored, null, 2));

    await interaction.editReply({ content: '✅ Reaction role message created.' });
  }
};
