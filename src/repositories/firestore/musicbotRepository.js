/**
 * Musicbot repository - Menangani operasi Firestore untuk pengaturan bot
 */
const { admin } = require('../../config/firebase');
const logger = require('../../utils/logger');

const LOG_CATEGORY = 'MusicbotRepository';

// Referensi koleksi untuk pengaturan bot di guild
const botGuildCollection = admin.firestore().collection('bot_guilds');

/**
 * Mendapatkan pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<Object|null>} - Pengaturan guild atau null jika tidak ditemukan
 */
const getGuildSettings = async (guildId) => {
  try {
    const doc = await botGuildCollection.doc(guildId).get();
    
    if (doc.exists) {
      return { guildID: guildId, ...doc.data() };
    }
    
    return { guildID: guildId, language: 'en' }; // Default settings
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error getting guild settings: ${error.message}`);
    return { guildID: guildId, language: 'en' }; // Default jika error
  }
};

/**
 * Memeriksa apakah guild terdaftar
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<boolean>} - True jika guild terdaftar, false jika tidak
 */
const isGuildRegistered = async (guildId) => {
  try {
    const doc = await botGuildCollection.doc(guildId).get();
    return doc.exists;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error checking guild registration: ${error.message}`);
    return false;
  }
};


/**
 * Memperbarui pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @param {Object} settings - Pengaturan guild yang akan diperbarui
 * @returns {Promise<boolean>} - True jika berhasil
 */
const updateGuildSettings = async (guildId, settings) => {
  try {
    await botGuildCollection.doc(guildId).set(
      { 
        ...settings,
        lastUpdated: Date.now()
      }, 
      { merge: true }
    );
    logger.debug(LOG_CATEGORY, `Updated guild ${guildId} settings`);
    return true;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error updating guild settings: ${error.message}`);
    throw error;
  }
};

/**
 * Menyimpan atau memperbarui pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @param {Object} settings - Pengaturan guild
 * @returns {Promise<boolean>} - True jika berhasil
 */
const saveGuildSettings = async (guildId, settings) => {
  return updateGuildSettings(guildId, settings);
};

/**
 * Mendapatkan bahasa guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<string>} - Kode bahasa
 */
const getGuildLanguage = async (guildId) => {
  try {
    const doc = await botGuildCollection.doc(guildId).get();
    
    if (doc.exists) {
      return doc.data().language || 'en';
    }
    
    return 'en'; // Default ke bahasa Inggris
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error getting guild language: ${error.message}`);
    return 'en'; // Default ke bahasa Inggris jika ada error
  }
};

/**
 * Menyimpan bahasa guild
 * @param {string} guildId - ID guild Discord
 * @param {string} language - Kode bahasa
 * @returns {Promise<boolean>} - True jika berhasil
 */
const saveGuildLanguage = async (guildId, language) => {
  try {
    await botGuildCollection.doc(guildId).set({ 
      guildID: guildId,
      language 
    }, { merge: true });
    
    return true;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error saving guild language: ${error.message}`);
    throw error;
  }
};

/**
 * Menambahkan channel ke guild
 * @param {string} guildId - ID guild Discord
 * @param {Object} channelData - Data channel
 * @returns {Promise<boolean>} - True jika berhasil
 */
const addChannelToGuild = async (guildId, channelData) => {
  try {
    const guildDoc = await botGuildCollection.doc(guildId).get();
    
    if (guildDoc.exists) {
      const guildData = guildDoc.data();
      const channels = guildData.channels || [];
      
      // Check if channel already exists
      if (!channels.some(c => c.channel === channelData.channel)) {
        channels.push(channelData);
      }
      
      await botGuildCollection.doc(guildId).update({ channels });
    } else {
      await botGuildCollection.doc(guildId).set({
        guildID: guildId,
        channels: [channelData]
      });
    }
    
    return true;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error adding channel to guild: ${error.message}`);
    throw error;
  }
};

/**
 * Menghapus channel dari guild
 * @param {string} guildId - ID guild Discord
 * @param {string} channelId - ID channel Discord
 * @returns {Promise<boolean>} - True jika berhasil
 */
const removeChannelFromGuild = async (guildId, channelId) => {
  try {
    const guildDoc = await botGuildCollection.doc(guildId).get();
    
    if (guildDoc.exists) {
      const guildData = guildDoc.data();
      let channels = guildData.channels || [];
      
      // Remove channel
      channels = channels.filter(c => c.channel !== channelId);
      
      await botGuildCollection.doc(guildId).update({ channels });
    }
    
    return true;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error removing channel from guild: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getGuildSettings,
  updateGuildSettings,
  saveGuildSettings,
  getGuildLanguage,
  saveGuildLanguage,
  addChannelToGuild,
  isGuildRegistered,
  removeChannelFromGuild
}; 