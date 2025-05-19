const { EmbedBuilder } = require("discord.js")
const db = require("../../mongoDB")

module.exports = async (client, queue) => {
  console.log(`[DEBUG] Finish event triggered for guild: ${queue?.textChannel?.guild?.id}`);
  console.log(`[DEBUG] Queue songs length: ${queue?.songs?.length || 0}`);
  
  // Queue details logging for debugging purposes
  if (queue) {
    console.log(`[DEBUG] Queue info: Voice channel: ${queue?.voice?.channel?.id}, Text channel: ${queue?.textChannel?.id}`);
    console.log(`[DEBUG] Queue isFinished: ${queue?.isFinished || false}, isStopped: ${queue?.isStopped || false}`);
  }
  
  // Add a delay before reporting queue is empty to prevent race conditions
  setTimeout(async () => {
    try {
      // Check if queue still exists and is still empty after the delay
      if (queue?.textChannel?.guild?.id) {
        // Periksa ulang status queue setelah delay
        const currentQueue = client.player.getQueue(queue.textChannel.guild.id);
        
        // Cek apakah masih terhubung ke voice channel
        const isConnected = currentQueue?.voice?.connection && currentQueue?.voice?.channel;
        
        console.log(`[DEBUG] After delay - Queue exists: ${!!currentQueue}, Songs: ${currentQueue?.songs?.length || 0}, Connected: ${!!isConnected}`);
        
        // Check if queue is empty AND we're either still connected or manually stopped
        if ((!currentQueue || !currentQueue.songs || currentQueue.songs.length === 0) && 
            (isConnected || queue.isStopped)) {
          
          let lang = await db?.musicbot?.findOne({
            guildID: queue?.textChannel?.guild?.id,
          })
          lang = lang?.language || client.language
          lang = require(`../../languages/${lang}.js`)
          
          // Pilih pesan berdasarkan apakah antrian dihentikan manual (skipped) atau selesai sendiri
          const finishMessage = queue.isStopped ? 
            lang.msg14 || "Queue is empty. You can play some more music, byebye... " : 
            lang.msg15 || "I disconnected because there is no one left in my channel. ❌";

          const embed = new EmbedBuilder()
            .setColor("#FFC0CB")
            .setTitle(lang.queue_finished || "Queue Finished")
            .setDescription(finishMessage)
            .setFooter({ text: `Parrhesia 🌀` })

          if (queue?.textChannel) {
            queue.textChannel.send({ embeds: [embed] }).catch((e) => {
              console.error("Error sending queue finished message:", e)
            })
          }
          
          // Reset state
          if (currentQueue) {
            currentQueue.isStopped = false;
          }
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error in finish event handler:", error);
    }
  }, 2000) // 2 second delay untuk memastikan queue sudah diperbarui
}
