const { EmbedBuilder } = require("discord.js")
const db = require("../../mongoDB")

module.exports = async (client, queue) => {
  console.log(`[DEBUG] Finish event triggered for guild: ${queue?.textChannel?.guild?.id}`);
  console.log(`[DEBUG] Queue songs length: ${queue?.songs?.length || 0}`);
  
  // Queue details logging for debugging purposes
  if (queue) {
    console.log(`[DEBUG] Queue info: Voice channel: ${queue?.voice?.channel?.id}, Text channel: ${queue?.textChannel?.id}`);
  }
  
  // Add a delay before reporting queue is empty to prevent race conditions
  setTimeout(async () => {
    try {
      // Check if queue still exists and is still empty after the delay
      if (queue?.textChannel?.guild?.id) {
        const currentQueue = client.player.getQueue(queue.textChannel.guild.id);
        console.log(`[DEBUG] After delay - Queue exists: ${!!currentQueue}, Songs: ${currentQueue?.songs?.length || 0}`);
        
        if (!currentQueue || !currentQueue.songs || currentQueue.songs.length === 0) {
          let lang = await db?.musicbot?.findOne({
            guildID: queue?.textChannel?.guild?.id,
          })
          lang = lang?.language || client.language
          lang = require(`../../languages/${lang}.js`)

          const embed = new EmbedBuilder()
            .setColor("#FFC0CB")
            .setTitle(lang.queue_finished)
            .setDescription(lang.msg15)
            .setFooter({ text: `Parrhesia 🌀` })

          if (queue?.textChannel) {
            queue.textChannel.send({ embeds: [embed] }).catch((e) => {
              console.error("Error sending queue finished message:", e)
            })
          }
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error in finish event handler:", error);
    }
  }, 5000) // 5 second delay to ensure we don't prematurely report empty queue
}
