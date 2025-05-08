const { EmbedBuilder } = require("discord.js");
const db = require("../mongoDB");
module.exports = {
  name: "about",
  description: "It helps you to get information about the bot.",
  permissions: "0x0000000000000800",
  options: [],
  run: async (client, interaction) => {
    let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id });
    lang = lang?.language || client.language;
    lang = require(`../languages/${lang}.js`);

    try {
      const start = Date.now();
      interaction
        .reply("0")
        .then((msg) => {
          const end = Date.now();
          const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setTitle(client.user.username + " - Pong!")
            .setThumbnail(client.user.displayAvatarURL())
            .addFields([
              {
                name: "Multifunction bot made by Muhammad Abiyyu Al-Ghifari",
                value: "instagram: @abiifahri",
              },
            ])
            .setTimestamp()
            .setFooter({ text: `Parrhesia 🌀` });
          return interaction.editReply({ embeds: [embed] }).catch((e) => {});
        })
        .catch((err) => {});
    } catch (e) {
      const errorNotifer = require("../functions.js");
      errorNotifer(client, interaction, e, lang);
    }
  },
};
