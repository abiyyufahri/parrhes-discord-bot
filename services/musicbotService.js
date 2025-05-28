/**
 * Service layer untuk musicbot
 * Menghubungkan command dengan repository
 */
const musicbotRepository = require('../repository/firestore/musicbotRepository');
const config = require('../config.js');


/**
 * Menandai guild sebagai aktif atau tidak aktif
 * @param {string} guildId - ID guild Discord
 * @param {boolean} isActive - Status aktif guild
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const setGuildActiveStatus = async (guildId, isActive) => {
  try {
    const updateData = {
      isActive: isActive,
    };
    
    return await musicbotRepository.saveGuildSettings(guildId, updateData);
  } catch (error) {
    console.error('[MusicbotService] Error setting guild active status:', error);
    return false;
  }
};

/**
 * Mendapatkan status aktif guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<boolean>} - Status aktif guild
 */
const getGuildActiveStatus = async (guildId) => {
  try {
    const settings = await musicbotRepository.getGuildSettings(guildId);
    return settings?.isActive !== false; // Default to true if not set
  } catch (error) {
    console.error('[MusicbotService] Error getting guild active status:', error);
    return true; // Default to active if error occurs
  }
};

module.exports = {
  setGuildActiveStatus,
  getGuildActiveStatus
};