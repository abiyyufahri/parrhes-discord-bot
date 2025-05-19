const { EmbedBuilder } = require("discord.js")
const db = require("../../mongoDB")

module.exports = async (client, queue, song) => {
  if (!queue || !song) return;
  
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
  console.log(`[DEBUG] Queue info: Voice connected: ${!!queue.voice?.connection}, Voice channel ID: ${queue.voice?.channel?.id}`);
  console.log(`[DEBUG] Total songs in queue: ${queue.songs?.length}`);
  
  // DisTube v5: Memastikan queue tidak dihapus dengan cara yang benar
  if (queue.options) {
    queue.options.leaveOnEnd = false;
  }

  // Load language with error handling
  let lang;
  try {
    const guildData = await db?.musicbot?.findOne({
      guildID: queue?.textChannel?.guild?.id,
    });
    lang = require(`../../languages/${guildData?.language || client.language || "en"}.js`);
  } catch (e) {
    lang = require(`../../languages/en.js`);
    console.error("Error loading language, using default:", e);
  }

  // Skip if looping message option is off
  if (!client.config.opt.loopMessage && queue?.repeatMode !== 0) return;

  // Send now playing message
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
        .setTimestamp();

      console.log(`[DEBUG] playSong message sent successfully: AA`);
      
      // Simplified approach: ALWAYS send a new message for now playing
      try {
        // No edits, just send fresh message - this avoids race conditions
        await queue.textChannel.send({ embeds: [embed] });
        console.log(`[DEBUG] Sent new playSong message`);
      } catch (sendError) {
        console.error(`[DEBUG] Error sending new playSong message:`, sendError);
      }

      // Verification check that song is actually playing - with improved handling
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
                // Force reconnect if voice connection is lost
                if (!currentQueue.voice?.connection && currentQueue.voice?.channel) {
                  const { joinVoiceChannel } = require('@discordjs/voice');
                  joinVoiceChannel({
                    channelId: currentQueue.voice.channel.id,
                    guildId: queue.textChannel.guild.id,
                    adapterCreator: queue.textChannel.guild.voiceAdapterCreator,
                    selfDeaf: true
                  });
                  
                  // Short delay before resuming
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
                // Try to resume playback
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
