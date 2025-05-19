/**
 * Musicbot repository - Menangani operasi Firestore untuk pengaturan bot
 */
const { admin } = require('../../firebaseConfig');

// Referensi koleksi untuk pengaturan bot di guild
const musicbotCollection = admin.firestore().collection('musicbot');

/**
 * Mendapatkan pengaturan guild berdasarkan guildID
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<Object|null>} - Pengaturan guild atau null jika tidak ditemukan
 */
const getGuildSettings = async (guildId) => {
  try {
    const doc = await musicbotCollection.doc(guildId).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('[MusicbotRepository] Error getting guild settings:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua pengaturan guild
 * @returns {Promise<Array>} - Array dari semua pengaturan guild
 */
const getAllGuildSettings = async () => {
  try {
    const snapshot = await musicbotCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[MusicbotRepository] Error getting all guild settings:', error);
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
  try {
    await musicbotCollection.doc(guildId).set(settings, { merge: true });
    return true;
  } catch (error) {
    console.error('[MusicbotRepository] Error saving guild settings:', error);
    throw error;
  }
};

/**
 * Menghapus pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<boolean>} - True jika berhasil
 */
const deleteGuildSettings = async (guildId) => {
  try {
    await musicbotCollection.doc(guildId).delete();
    return true;
  } catch (error) {
    console.error('[MusicbotRepository] Error deleting guild settings:', error);
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
    const doc = await musicbotCollection.doc(guildId).get();
    
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
    await musicbotCollection.doc(guildId).set({ 
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
  getGuildSettings,
  getAllGuildSettings,
  saveGuildSettings,
  deleteGuildSettings,
  getGuildLanguage,
  saveGuildLanguage
}; 