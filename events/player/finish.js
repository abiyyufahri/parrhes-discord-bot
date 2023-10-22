const db = require("../../mongoDB");
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, queue) => {
  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  });
  lang = lang?.language || client.language;
  lang = require(`../../languages/${lang}.js`);
  if (queue?.textChannel) {
    const embed = new EmbedBuilder()
    .setColor('#474747') // Set the color of the embed
    .setDescription(`${lang.msg14}`)

    queue.textChannel.send({ embeds: [embed] }).catch((e) => {
        console.error(e);
      });
  }
};
