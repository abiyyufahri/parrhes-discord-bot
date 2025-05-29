/**
 * Utility functions for error handling
 */
const logger = require('./logger');
const LOG_CATEGORY = 'ErrorNotifier';

/**
 * Report error to user and log it
 * @param {Client} client - Discord client 
 * @param {Interaction} int - Discord interaction object
 * @param {Error} error - Error object
 * @param {Object} lang - Language strings
 */
module.exports = async (client, int, error, lang) => {
    logger.error(LOG_CATEGORY, `Error occurred: ${error.message}\n${error.stack}`);
    
    if (client?.shard) {
        console.log(`[${String(new Date).split(" ", 5).join(" ")}] (Error) [${int?.guild?.name}] ${error.stack}`.red);
    } else {
        console.log(`[${String(new Date).split(" ", 5).join(" ")}] (Error) [${int?.guild?.name}] ${error.stack}`.red);
    }

    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    // Try to send error message to user
    try {
        const errorMessage = lang?.error7 || "An error occurred while executing this command.";
        
        if (int && !int.replied && !int.deferred) {
            await int.reply({ 
                content: errorMessage, 
                ephemeral: true 
            });
        } else if (int && int.replied) {
            // If already replied, try to follow up
            await int.followUp({ 
                content: errorMessage, 
                ephemeral: true 
            });
        } else if (int?.channel) {
            // Last resort - send to channel
            await int.channel.send({ 
                content: errorMessage 
            });
        }
    } catch (notificationError) {
        logger.error(LOG_CATEGORY, `Could not send error notification: ${notificationError.message}`);
    }

    // Log to Discord error channel if configured
    if (client?.config?.errorLog) {
        const errorLogChannel = client.channels.cache.get(client.config.errorLog);
        if (errorLogChannel) {
            const embed = new EmbedBuilder()
                .setColor(client?.config?.embedColor || 'Red')
                .setTitle('Error Report')
                .addFields([
                    { name: 'Guild', value: `${int?.guild?.name} (${int?.guild?.id})` || 'Unknown', inline: true },
                    { name: 'Channel', value: `${int?.channel?.name} (${int?.channel?.id})` || 'Unknown', inline: true },
                    { name: 'User', value: `${int?.user?.tag} (${int?.user?.id})` || 'Unknown', inline: true },
                    { name: 'Command', value: int?.commandName || 'Unknown', inline: true },
                    { name: 'Error', value: `\`\`\`js\n${error.message}\`\`\``, inline: false }
                ])
                .setTimestamp();
                
            await errorLogChannel.send({ embeds: [embed] }).catch(e => {});
        }
    }
}; 