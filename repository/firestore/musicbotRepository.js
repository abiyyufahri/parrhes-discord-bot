/**
 * Musicbot repository - Menangani operasi Firestore untuk pengaturan bot
 */
const { admin } = require('../../firebaseConfig');

// Referensi koleksi untuk pengaturan bot di guild
const botGuildCollection = admin.firestore().collection('bot_guilds');


/**
 * Menyimpan atau memperbarui pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @param {Object} settings - Pengaturan guild
 * @returns {Promise<boolean>} - True jika berhasil
 */
const saveGuildSettings = async (guildId, settings) => {
  try {
    await botGuildCollection.doc(guildId).set(settings, { merge: true });
    return true;
  } catch (error) {
    console.error('[MusicbotRepository] Error saving guild settings:', error);
    throw error;
  }
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
    console.error('[MusicbotRepository] Error getting guild language:', error);
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
    console.error('[MusicbotRepository] Error saving guild language:', error);
    throw error;
  }
};

module.exports = {
  saveGuildSettings,
  getGuildLanguage,
  saveGuildLanguage
}; 