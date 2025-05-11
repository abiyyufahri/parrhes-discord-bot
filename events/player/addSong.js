const db = require("../../mongoDB");
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, queue, song) => {
  // Menampilkan panjang queue sebelum lagu ditambahkan
  console.log(`[QUEUE INFO] Panjang queue saat ini: ${queue?.songs?.length || 0} lagu`);
  
  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  });
  lang = lang?.language || client.language;
  lang = require(`../../languages/${lang}.js`);
  
  if (queue) {
    if (!client.config.opt.loopMessage && queue?.repeatMode !== 0) return;
    if(queue?.songs?.length == 1) return; 
    
    if (queue?.textChannel) {
      const embed = new EmbedBuilder()
        .setColor('#F7A531') // Set the color of the embed
        .setDescription(`<@${song.user.id}>, **${song.name}** ${lang.msg79} <:musicadded:1166423244316889088>`)

        song.metadata?.loadingMessage.edit({ embeds: [embed] }).catch((e) => {
        console.error(e);
      });
    }
  }
};
