const { EmbedBuilder } = require("discord.js");
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
module.exports = {
  name: "ping",
  description: "It helps you to get information about the speed of the bot.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });
    const langCode = dbLang?.language || client.language;
    const lang = loadLanguage(langCode);    try {
      const start = Date.now();
      await interaction.reply("🏓 Calculating ping...");
      
      const replyTime = Date.now() - start;
      
      const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setTitle(client.user.username + " - Pong!")
        .setThumbnail(client.user.displayAvatarURL())
        .addFields([
          { name: lang.msg49, value: `\`${replyTime}ms\` 🛰️` },
          { name: lang.msg50, value: `\`${Date.now() - start}ms\` 🛰️` },
          {
            name: lang.msg51,
            value: `\`${Math.round(client.ws.ping)}ms\` 🛰️`,
          },
        ])
        .setTimestamp()
        .setFooter({ text: `Parrhesia 🌀` });
      
      await interaction.editReply({ content: "", embeds: [embed] });
    } catch (e) {
      const errorNotifer = require("../../utils/functions.js");
      await errorNotifer(client, interaction, e, lang);
    }
  },
};
