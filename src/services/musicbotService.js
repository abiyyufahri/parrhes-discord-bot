/**
 * Music Bot Service
 * Handles operations related to music bot functionality across guilds
 */

const { dbService } = require('./core');
const logger = require('../utils/logger');

const LOG_CATEGORY = 'MusicBotService';

/**
 * Set guild active status in the database
 * @param {String} guildId - Discord guild ID
 * @param {Boolean} isActive - Whether the guild is active
 * @returns {Promise<Boolean>} - Success status
 */
async function setGuildActiveStatus(guildId, isActive = true) {
  if (!guildId) {
    logger.error(LOG_CATEGORY, 'Cannot update guild status: No guild ID provided');
    return false;
  }

  try {
    // Coba menggunakan findOneAndUpdate
    try {
      await dbService.musicbot.findOneAndUpdate(
        { guildID: guildId },
        { $set: { isActive: isActive, lastUpdated: Date.now() } },
        { upsert: true }
      );
    } catch (innerError) {
      // Jika findOneAndUpdate tidak ada, gunakan updateOne sebagai fallback
      logger.warn(LOG_CATEGORY, `findOneAndUpdate failed, using updateOne as fallback: ${innerError.message}`);
      await dbService.musicbot.updateOne(
        { guildID: guildId },
        { $set: { isActive: isActive, lastUpdated: Date.now() } },
        { upsert: true }
      );
    }
    
    logger.info(LOG_CATEGORY, `Guild ${guildId} status updated: isActive = ${isActive}`);
    return true;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error updating guild ${guildId} status: ${error.message}`);
    return false;
  }
}

/**
 * Get all active guilds
 * @returns {Promise<Array>} - List of active guilds
 */
async function getActiveGuilds() {
  try {
    return await dbService.musicbot.find({ isActive: true });
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error fetching active guilds: ${error.message}`);
    return [];
  }
}

module.exports = {
  setGuildActiveStatus,
  getActiveGuilds
}; 