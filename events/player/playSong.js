const { EmbedBuilder } = require("discord.js")
const db = require("../../mongoDB")

module.exports = async (client, queue, song) => {
  
  // Menampilkan panjang queue sebelum musik diputar
  console.log(`[QUEUE LENGTH] Panjang queue sebelum memutar "${song?.name}": ${queue?.songs?.length || 0} lagu`);
  
  console.log(`[DEBUG] playSong event triggered for song: "${song?.name}" in guild: ${queue?.textChannel?.guild?.id}`);
  
  // Debug song object to understand available properties
  console.log(`[DEBUG] Song details:`, {

    name: song?.name,
    url: song?.url,
    formattedDuration: song?.formattedDuration,
    source: song?.source,
    user: song?.user?.id ? `${song?.user?.id} (${song?.user?.username})` : 'Unknown'
  });
  
  // Debug queue info
  if (queue) {
    console.log(`[DEBUG] Queue info: Voice connected: ${!!queue.voice?.connection}, Voice channel ID: ${queue.voice?.channel?.id}`);
    console.log(`[DEBUG] Total songs in queue: ${queue.songs?.length}`);
    
    // DisTube v5: Memastikan queue tidak dihapus dengan cara yang benar
    if (queue.options) {
      queue.options.leaveOnEnd = false;
    }
  }

  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  })
  lang = lang?.language || client.language
  lang = require(`../../languages/${lang}.js`)

  if (queue) {
    if (!client.config.opt.loopMessage && queue?.repeatMode !== 0) return

    if (queue?.textChannel) {
      try {
        const embed = new EmbedBuilder()
          .setColor("#3498db")
          .setTitle(`<:music:1166419533360283648> ${lang.now_playing}`)
          .setDescription(
            lang.msg13
              .replace("{track?.title}", song?.name)
              .replace("{queue?.connection.channel.name}", `<#${queue.voice.channel.id}>`),
          )
          .setThumbnail(song.thumbnail || "https://img.youtube.com/vi/default/hqdefault.jpg")
          .addFields([
            { name: lang.duration, value: song.formattedDuration || "Unknown", inline: true },
            { name: lang.requested_by, value: song.user ? `<@${song.user.id}>` : 'Unknown User', inline: true },
            { name: lang.source, value: song.source ? (song.source.charAt(0).toUpperCase() + song.source.slice(1)) : "Unknown", inline: true },
          ])
          .setFooter({ 
            text: lang.queue_footer.replace("{songCount}", queue.songs.length) 
          })
          .setTimestamp()

        // Send notification that music is being played
        console.log(`[DEBUG] Embed: ${queue.metadata?.loadingMessage}`);
        console.log(`[DEBUG] playSong message sent successfully: AA`);
        
        // Coba ambil loadingMessage dari queue.metadata atau song.metadata
        const loadingMessage = song.metadata?.loadingMessage || queue.metadata?.loadingMessage;
        console.log(`[DEBUG][playSong.js] Loading Embed: ${loadingMessage?.id || 'not found'}`);
        
        // Perbarui pesan loading jika tersedia
        if (loadingMessage && typeof loadingMessage.edit === 'function') {
          // Untuk lagu dalam playlist, selalu kirim pesan baru untuk now playing
          // sehingga tidak menimpa pesan playlist
          try {
            // Kirim pesan baru untuk semua lagu (termasuk lagu pertama)
            const newMessage = await queue.textChannel.send({ embeds: [embed] });
            console.log(`[DEBUG] Sent new playSong message: ${newMessage.id}`);
            
            // NONAKTIFKAN edit pesan yang sudah ada
            // // Cek apakah ini lagu pertama dari playlist. Jika ya, jangan edit loadingMessage
            // // tapi kirim pesan baru, agar tidak menimpa pesan playlist
            // if (queue.songs.length <= 1) {
            //   try {
            //     await queue.textChannel.send({ embeds: [embed] });
            //     console.log(`[DEBUG] Sent new playSong message for first song`);
            //   } catch (sendError) {
            //     console.error(`[DEBUG] Error sending new message for first song:`, sendError);
            //   }
            // } else {
            //   // Untuk lagu selain lagu pertama, edit loadingMessage
            //   try {
            //     // Cek apakah pesan masih valid dengan mengecek properti atau metode
            //     const isValidMessage = loadingMessage.channelId && !loadingMessage.deleted;
            //     
            //     if (isValidMessage) {
            //       const playSongMessage = await loadingMessage.edit({ embeds: [embed] }).catch(err => {
            //         // Jika error Unknown Message, kirim pesan baru
            //         if (err.code === 10008) {
            //           console.log(`[DEBUG] Message not found, sending new message instead`);
            //           return queue.textChannel.send({ embeds: [embed] });
            //         }
            //         throw err; // Re-throw jika bukan Unknown Message error
            //       });
            //       
            //       if (playSongMessage) {
            //          console.log(`[DEBUG] playSong message edited successfully: ${playSongMessage.id}`);
            //       }
            //     } else {
            //       // Jika pesan tidak valid, kirim pesan baru
            //       const newMessage = await queue.textChannel.send({ embeds: [embed] });
            //       console.log(`[DEBUG] Sent new message because original was invalid: ${newMessage.id}`);
            //     }
            //   } catch (editError) {
            //     console.error(`[DEBUG] Error editing loading message:`, editError);
            //     // Coba kirim pesan baru jika gagal mengedit
            //     try {
            //       await queue.textChannel.send({ embeds: [embed] });
            //     } catch (sendError) {
            //       console.error(`[DEBUG] Error sending new message:`, sendError);
            //     }
            //   }
            // }
          } catch (sendError) {
            console.error(`[DEBUG] Error sending new playSong message:`, sendError);
          }
        } else {
          // Jika tidak ada loadingMessage, kirim pesan baru
          try {
            await queue.textChannel.send({ embeds: [embed] });
            console.log(`[DEBUG] Sent new playSong message`);
          } catch (sendError) {
            console.error(`[DEBUG] Error sending new message:`, sendError);
          }
        }

        // Delete the loading message if it exists in metadata and it's not the first song in a playlist
        // Jangan hapus jika this is first song (queue.songs.length <= 1)
        // PENTING: Untuk playlist, kita tidak perlu menghapus pesan sama sekali
        // Sebagai gantinya, kita simpan ID pesan playlist di queue.metadata
        
        // Nonaktifkan penghapusan pesan
        // if (loadingMessage && typeof loadingMessage.delete === 'function' && queue.songs.length > 1) {
        //   try {
        //     // Cek apakah pesan masih valid sebelum dihapus
        //     const isValidMessage = loadingMessage.channelId && !loadingMessage.deleted;
        //     
        //     if (isValidMessage) {
        //       await loadingMessage.delete().catch(err => {
        //         // Jika error Unknown Message, abaikan saja
        //         if (err.code === 10008) {
        //           console.log(`[DEBUG] Message not found when trying to delete, ignoring`);
        //           return;
        //         }
        //         throw err; // Re-throw jika bukan Unknown Message error
        //       });
        //       console.log(`[DEBUG] Deleted loading message: ${loadingMessage.id} (not first song)`);
        //     } else {
        //       console.log(`[DEBUG] Skipped deleting invalid message`);
        //     }
        //   } catch (deleteError) {
        //     console.error(`[DEBUG] Failed to delete loading message:`, deleteError);
        //   }
        // } else if (loadingMessage) {
        //   console.log(`[DEBUG] Kept loading message for first song: ${loadingMessage?.id || 'unknown'}`);
        // }

        // Simpan loadingMessage ID di queue.metadata jika belum ada
        if (loadingMessage && loadingMessage.id && !queue.metadata?.playlistMessageId) {
          queue.metadata = queue.metadata || {};
          queue.metadata.playlistMessageId = loadingMessage.id;
          console.log(`[DEBUG] Saved playlist message ID: ${loadingMessage.id}`);
        }

        // Verification check that song is actually playing
        setTimeout(async () => {
          try {
            // Check if queue still exists
            const currentQueue = client.player.getQueue(queue.textChannel.guild.id);
            
            if (currentQueue) {
              const isPlaying = currentQueue.playing;
              console.log(`[DEBUG] After 3s, isPlaying: ${isPlaying}`);
              
              // If song isn't playing, try to resume
              if (!isPlaying && currentQueue.songs?.length > 0) {
                console.log(`[DEBUG] Track not playing, attempting to fix...`);
                
                try {
                  await currentQueue.resume();
                  console.log(`[DEBUG] Attempted to resume playback`);
                } catch (restartError) {
                  console.error(`[DEBUG] Error resuming playback:`, restartError);
                }
              }
            }
          } catch (checkError) {
            console.error(`[DEBUG] Error checking playback:`, checkError);
          }
        }, 3000);
      } catch (e) {
        console.error("Error in playSong event:", e);
      }
    }
  }
}
