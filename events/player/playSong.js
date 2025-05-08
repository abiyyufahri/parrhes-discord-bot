const { EmbedBuilder } = require('discord.js');
const db = require("../../mongoDB");

module.exports = async (client, queue, song) => {
  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  });
  lang = lang?.language || client.language;
  lang = require(`../../languages/${lang}.js`);

  if (queue) {
    if (!client.config.opt.loopMessage && queue?.repeatMode !== 0) return;

    if (queue?.textChannel) {
      const embed = new EmbedBuilder()
        .setColor('#3498db') // Set the color of the embed
        .setTitle('<:music:1166419533360283648> Now Playing')
        .setDescription(lang.msg13.replace("{track?.title}", song?.name).replace("{queue?.connection.channel.name}", `<#${queue.voice.connection.joinConfig.channelId}>`))

      queue.textChannel.send({ embeds: [embed] }).catch((e) => {
        console.error(e);
      });
    }
  }
};
