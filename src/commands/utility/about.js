const { EmbedBuilder } = require("discord.js");
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "about",
  description: "It helps you to get information about the bot.",
  permissions: "0x0000000000000800",
  options: [],  run: async (client, interaction) => {
    let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });
    const langCode = dbLang?.language || client.language;
    const lang = loadLanguage(langCode);

    try {
      const start = Date.now();
      await interaction.reply("🔄 Loading bot information...");
      
      const end = Date.now();
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(client.user.username + " - About")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields([
          {
            name: "Multifunction bot made by Muhammad Abiyyu Al-Ghifari",
            value: "instagram: @abiifahri",
          },
        ])
        .setTimestamp()
        .setFooter({ text: `Parrhesia 🌀` });
        
      await interaction.editReply({ content: "", embeds: [embed] });
    } catch (e) {
      const errorNotifer = require("../../utils/functions.js");
      errorNotifer(client, interaction, e, lang);
    }
  },
};
