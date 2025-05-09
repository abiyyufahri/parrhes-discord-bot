const { EmbedBuilder } = require("discord.js")
const db = require("../../mongoDB")

module.exports = async (client, queue, song) => {
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
          .setTitle("<:music:1166419533360283648> Now Playing")
          .setDescription(
            lang.msg13
              .replace("{track?.title}", song?.name)
              .replace("{queue?.connection.channel.name}", `<#${queue.voice.channel.id}>`),
          )
          .setThumbnail(song.thumbnail || "https://img.youtube.com/vi/default/hqdefault.jpg")
          .addFields([
            { name: "Duration", value: song.formattedDuration || "Unknown", inline: true },
            { name: "Requested By", value: song.user ? `<@${song.user.id}>` : 'Unknown User', inline: true },
            { name: "Source", value: song.source || "Unknown", inline: true },
          ])
          .setFooter({ text: `Parrhesia 🌀 | Queue has ${queue.songs.length} song(s)` })
          .setTimestamp()

        // Send notification that music is being played
        const playSongMessage = await queue.textChannel.send({ embeds: [embed] });
        console.log(`[DEBUG] playSong message sent successfully: ${playSongMessage.id}`);

        // Delete the loading message if it exists in metadata
        if (queue.metadata?.loadingMessage) {
          try {
            await queue.metadata.loadingMessage.delete();
            console.log(`[DEBUG] Deleted loading message: ${queue.metadata.loadingMessage.id}`);
            // Optionally, clear it from metadata if it won't be used again or if metadata is reused for other things
            // queue.metadata.loadingMessage = null; 
          } catch (deleteError) {
            console.error(`[DEBUG] Failed to delete loading message:`, deleteError);
          }
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
