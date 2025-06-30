const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { server } = require('../utils/exaroton-client');

const WHITELIST_FILE = path.join(__dirname, '..', 'data', 'whitelist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deathcount')
    .setDescription('Show the death count for all whitelisted players'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
      // Load whitelist
      const whitelist = fs.existsSync(WHITELIST_FILE)
        ? JSON.parse(fs.readFileSync(WHITELIST_FILE))
        : {};
      const players = Object.values(whitelist);
      if (!players.length) {
        return interaction.editReply('No players in whitelist.');
      }
      // For each player, get their death count from world/stats/[UUID].json
      const results = [];
      for (const player of players) {
        const uuid = player.uuid;
        const username = player.username;
        const file = server.getFile(`world/stats/${uuid}.json`);
        let deaths = 0;
        try {
          const content = await file.getContent();
          const stats = JSON.parse(content);
          deaths = stats?.stats?.["minecraft:custom"]?.["minecraft:deaths"] || 0;
        } catch (e) {
          deaths = 0; // If file not found or parse error, treat as 0
        }
        results.push({ username, deaths });
      }
      // Format the output
      const output = results.map(r => ` - ${r.username}: ${r.deaths}`).join('\n');
      await interaction.editReply({
        content: `**Death Counts:**\n${output}`,
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '? Error: ' + err.message, ephemeral: true });
    }
  }
};
