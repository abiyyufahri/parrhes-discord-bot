const { setGuildActiveStatus } = require('../../services/musicbotService');
const { dbService } = require('../../services/core');

module.exports = async (client, guild) => {
  try {
    console.log(`[GUILD DELETE] Bot was removed from guild: ${guild.name} (${guild.id})`);
    
    const guildExists = await dbService.server.findOne({ guildID: guild.id });

    if (!guildExists) {
      return;
    }

    // Mark the guild as inactive using the service layer
    const success = await setGuildActiveStatus(guild.id, false);
    
    if (success) {
      console.log(`[GUILD DELETE] Successfully marked guild ${guild.id} as inactive in database`);
    } else {
      console.error(`[GUILD DELETE] Failed to update guild ${guild.id} status in database`);
    }
    
    // Optional: Send notification to bot owner or log channel if configured
    if (client.config.errorLog) {
      const logChannel = client.channels.cache.get(client.config.errorLog);
      if (logChannel) {
        try {
          await logChannel.send({
            content: `🚪 **Bot Removed from Guild**\n` +
                    `**Guild:** ${guild.name} (${guild.id})\n` +
                    `**Members:** ${guild.memberCount}\n` +
                    `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
          });
        } catch (error) {
          console.error('[GUILD DELETE] Failed to send log message:', error);
        }
      }
    }
    
  } catch (error) {
    console.error('[GUILD DELETE] Error handling guild deletion:', error);
  }
};
