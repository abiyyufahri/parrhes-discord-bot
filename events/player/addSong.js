const db = require("../../mongoDB");
const { EmbedBuilder } = require('discord.js');

module.exports = async (client, queue, song) => {
  // Track event ini untuk debugging
  console.log(`[QUEUE INFO] Panjang queue saat ini: ${queue.songs.length} lagu`);
  
  // Pastikan tidak ada operasi berat yang dijalankan di sini
  if (!song || !queue) return;
  
  try {
    // Deteksi apakah lagu berasal dari permintaan baru atau playlist
    const { isPlaylist, interaction } = queue.metadata || {};
    
    // Jika ini bukan playlist (single song) dan bukan lagu pertama, kirim pesan konfirmasi
    if (!isPlaylist && queue.songs.length > 1) {
      // Dapatkan judul lagu yang akan diputar berikutnya dari queue
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Lagu Ditambahkan ke Queue', iconURL: client.user.displayAvatarURL() })
        .setColor('#ffa954')
        .setThumbnail(song.thumbnail)
        .setDescription(`[${song.name}](${song.url})`)
        .addFields(
          { name: 'Durasi', value: song.formattedDuration || '00:00', inline: true },
          { name: 'Ditambahkan oleh', value: `<@${song.user.id}>`, inline: true },
          { name: 'Posisi di Queue', value: `${queue.songs.indexOf(song)}/${queue.songs.length}`, inline: true }
        )
        .setFooter({ text: `${client.user.username} • Music Bot` });
      
      // Kirimkan pesan konfirmasi dengan efisien
      // Gunakan interaction jika tersedia, jika tidak gunakan textChannel
      if (interaction && !interaction.replied) {
        try {
          await interaction.editReply({ embeds: [embed] }).catch(e => {});
        } catch (e) {
          if (queue.textChannel) {
            queue.textChannel.send({ embeds: [embed] }).catch(e => {});
          }
        }
      } else if (queue.textChannel) {
        queue.textChannel.send({ embeds: [embed] }).catch(e => {});
      }
    }
  } catch (e) {
    console.error('Error in addSong event:', e);
    // Jangan crash event handler meskipun ada error
  }
};
