/**
 * Service layer untuk musicbot
 * Menghubungkan command dengan repository
 */
const musicbotRepository = require('../repository/firestore/musicbotRepository');
const config = require('../config.js');

/**
 * Mendapatkan pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<Object>} - Pengaturan guild
 */
const getGuildSettings = async (guildId) => {
  try {
    const settings = await musicbotRepository.getGuildSettings(guildId);
    return settings || { guildID: guildId };
  } catch (error) {
    console.error('[MusicbotService] Error getting guild settings:', error);
    return { guildID: guildId };
  }
};

/**
 * Mendapatkan bahasa guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<string>} - Kode bahasa
 */
const getGuildLanguage = async (guildId) => {
  try {
    const language = await musicbotRepository.getGuildLanguage(guildId);
    return language || config.language || 'en';
  } catch (error) {
    console.error('[MusicbotService] Error getting guild language:', error);
    return config.language || 'en';
  }
};

/**
 * Menyimpan bahasa guild
 * @param {string} guildId - ID guild Discord
 * @param {string} language - Kode bahasa
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const saveGuildLanguage = async (guildId, language) => {
  try {
    return await musicbotRepository.saveGuildLanguage(guildId, language);
  } catch (error) {
    console.error('[MusicbotService] Error saving guild language:', error);
    return false;
  }
};

/**
 * Menyimpan channel DJ
 * @param {string} guildId - ID guild Discord
 * @param {string} channelId - ID channel
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const saveDJChannel = async (guildId, channelId) => {
  try {
    const settings = await getGuildSettings(guildId);
    settings.djChannel = channelId;
    
    return await musicbotRepository.saveGuildSettings(guildId, settings);
  } catch (error) {
    console.error('[MusicbotService] Error saving DJ channel:', error);
    return false;
  }
};

/**
 * Mendapatkan channel DJ
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<string|null>} - ID channel atau null jika tidak ada
 */
const getDJChannel = async (guildId) => {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.djChannel || null;
  } catch (error) {
    console.error('[MusicbotService] Error getting DJ channel:', error);
    return null;
  }
};

/**
 * Menyimpan peran DJ
 * @param {string} guildId - ID guild Discord
 * @param {string} roleId - ID peran
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const saveDJRole = async (guildId, roleId) => {
  try {
    const settings = await getGuildSettings(guildId);
    settings.djRole = roleId;
    
    return await musicbotRepository.saveGuildSettings(guildId, settings);
  } catch (error) {
    console.error('[MusicbotService] Error saving DJ role:', error);
    return false;
  }
};

/**
 * Mendapatkan peran DJ
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<string|null>} - ID peran atau null jika tidak ada
 */
const getDJRole = async (guildId) => {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.djRole || null;
  } catch (error) {
    console.error('[MusicbotService] Error getting DJ role:', error);
    return null;
  }
};

/**
 * Menyimpan channel musik default
 * @param {string} guildId - ID guild Discord
 * @param {string} channelId - ID channel
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const saveDefaultMusicChannel = async (guildId, channelId) => {
  try {
    const settings = await getGuildSettings(guildId);
    settings.musicChannel = channelId;
    
    return await musicbotRepository.saveGuildSettings(guildId, settings);
  } catch (error) {
    console.error('[MusicbotService] Error saving default music channel:', error);
    return false;
  }
};

/**
 * Mendapatkan channel musik default
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<string|null>} - ID channel atau null jika tidak ada
 */
const getDefaultMusicChannel = async (guildId) => {
  try {
    const settings = await getGuildSettings(guildId);
    return settings.musicChannel || null;
  } catch (error) {
    console.error('[MusicbotService] Error getting default music channel:', error);
    return null;
  }
};

/**
 * Menghapus semua pengaturan guild
 * @param {string} guildId - ID guild Discord
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const resetGuildSettings = async (guildId) => {
  try {
    return await musicbotRepository.deleteGuildSettings(guildId);
  } catch (error) {
    console.error('[MusicbotService] Error resetting guild settings:', error);
    return false;
  }
};

module.exports = {
  getGuildSettings,
  getGuildLanguage,
  saveGuildLanguage,
  saveDJChannel,
  getDJChannel,
  saveDJRole,
  getDJRole,
  saveDefaultMusicChannel,
  getDefaultMusicChannel,
  resetGuildSettings
}; 