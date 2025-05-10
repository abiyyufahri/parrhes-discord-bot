const db = require("../../mongoDB");
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, queue, song) => {
  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  });
  lang = lang?.language || client.language;
  lang = require(`../../languages/${lang}.js`);
  
  if (queue) {
    if (!client.config.opt.loopMessage && queue?.repeatMode !== 0) return;
    const isMoreThanOne = song.metadata?.playlistBatchPlay === true;
    
    if (queue?.textChannel && !isMoreThanOne) {
      const embed = new EmbedBuilder()
        .setColor('#F7A531') // Set the color of the embed
        .setDescription(`<@${song.user.id}>, **${song.name}** ${lang.msg79} <:musicadded:1166423244316889088>`)

      queue.textChannel.send({ embeds: [embed] }).catch((e) => {
        console.error(e);
      });
    }
  }
};
