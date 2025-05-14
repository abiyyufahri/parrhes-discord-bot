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
    
    if (queue?.textChannel) {
      const embed = new EmbedBuilder()
        .setColor('#F7A531') // Set the color of the embed
        .setDescription(`<@${song.user.id}>, **${song.name}** ${lang.msg79} <:musicadded:1166423244316889088>`)

      // Cek apakah ada metadata dan loadingMessage
      if (song.metadata?.loadingMessage && typeof song.metadata.loadingMessage.edit === 'function') {
        try {
          // Cek apakah pesan masih valid
          const isValidMessage = song.metadata.loadingMessage.channelId && !song.metadata.loadingMessage.deleted;
          
          if (isValidMessage) {
            await song.metadata.loadingMessage.edit({ embeds: [embed] }).catch(err => {
              // Jika error Unknown Message, kirim pesan baru
              if (err.code === 10008) {
                console.log(`[DEBUG][addSong.js] Message not found, sending new message instead`);
                return queue.textChannel.send({ embeds: [embed] });
              }
              throw err; // Re-throw jika bukan Unknown Message error
            });
          } else {
            // Jika pesan tidak valid, kirim pesan baru
            await queue.textChannel.send({ embeds: [embed] });
            console.log(`[DEBUG][addSong.js] Sent new message because original was invalid`);
          }
        } catch (e) {
          console.error(`[DEBUG][addSong.js] Error handling message:`, e);
          // Coba kirim pesan baru jika terjadi error
          try {
            await queue.textChannel.send({ embeds: [embed] });
          } catch (sendError) {
            console.error(`[DEBUG][addSong.js] Error sending new message:`, sendError);
          }
        }
      } else {
        // Jika tidak ada loadingMessage, kirim pesan baru
        try {
          await queue.textChannel.send({ embeds: [embed] });
          console.log(`[DEBUG][addSong.js] Sent new added song message`);
        } catch (sendError) {
          console.error(`[DEBUG][addSong.js] Error sending new message:`, sendError);
        }
      }
    }
  }
};
