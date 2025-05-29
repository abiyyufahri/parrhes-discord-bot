const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { toColonNotation } = require("../../utils/functions.js");
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
const YouTubeMusicPlugin = require("ytmusic-distube-plugin");

module.exports = {
  name: "search",
  description: "Search for a song on YouTube.",
  permissions: "0x0000000000000800",
  options: [
    {
      name: "query",
      description: "Write your search query",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  voiceChannel: false,
  run: async (client, interaction) => {
    try {
      // Defer reply to prevent timeout as search may take time
      await interaction.deferReply();

      // Get language settings
      let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });
    const langCode = dbLang?.language || client.language;
    const lang = loadLanguage(langCode);

      // Get search query
      const query = interaction.options.getString("query");

      // Create loading message
      const searchingEmbed = new EmbedBuilder()
        .setColor("#474747")
        .setDescription(`🔍 Mencari \`${query}\` di YouTube...`);
        
      await interaction.editReply({ embeds: [searchingEmbed] });

      try {
        // Perform YouTube search using the new YouTubePlugin
        const plugin = client.player.plugins.find(p => p instanceof YouTubeMusicPlugin);
        
        const searchResults = await plugin.searchSongs(query, { 
          limit: 3
        });

        // If no results found
        if (!searchResults || !searchResults.length) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setDescription("❌ Tidak ditemukan hasil pencarian untuk query tersebut.")
            ]
          });
        }

        // Format search results
        const resultsDescription = searchResults
          .map((song, index) => {
            // Format duration
            const duration = song.duration ? toColonNotation(song.duration) : "Live";
            // Return formatted line
            return `**${index + 1}.** [${song.name}](${song.url}) - \`${duration}\``;
          })
          .join("\n");

        // Create embed for search results
        const resultsEmbed = new EmbedBuilder()
          .setTitle(`📋 Hasil pencarian untuk: ${query}`)
          .setColor("#0099FF")
          .setDescription(resultsDescription)
          .setFooter({ 
            text: `Gunakan perintah /play untuk memutar salah satu lagu di atas.` 
          });

        // Send search results
        await interaction.editReply({ embeds: [resultsEmbed] });
      } catch (error) {
        console.error("Search error:", error);
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(`❌ Terjadi error saat mencari: ${error.message}`)
          ]
        });
      }
    } catch (error) {
      console.error("Top level search error:", error);
      if (interaction.replied || interaction.deferred) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ Terjadi error yang tidak terduga.")
          ]
        }).catch(console.error);
      } else {
        interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription("❌ Terjadi error yang tidak terduga.")
          ],
          ephemeral: true
        }).catch(console.error);
      }
    }
  }
};
