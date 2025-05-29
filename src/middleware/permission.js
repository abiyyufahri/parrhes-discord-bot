/**
 * Middleware untuk memeriksa izin pengguna
 */
const config = require('../config/bot');
const logger = require('../utils/logger');
const { dbService } = require('../services/core');

const LOG_CATEGORY = 'PermissionMiddleware';

/**
 * Memeriksa apakah pengguna memiliki izin DJ
 * 
 * @param {Client} client - Discord client
 * @param {Interaction} interaction - Discord interaction
 * @returns {boolean} True jika pengguna memiliki izin DJ
 */
function checkDJPermission(client, interaction) {
  const { guild } = interaction;
  const member = guild.members.cache.get(interaction.member.id);
  
  // Cek apakah command membutuhkan izin DJ
  const isDJCommand = config.opt.DJ.commands.includes(interaction.commandName);
  if (!isDJCommand) return true;
  
  // Cek DB untuk pengaturan DJ
  return new Promise(async (resolve) => {
    try {
      // Cek apakah user adalah owner
      if (interaction.member.id === interaction.guild.ownerId) {
        resolve(true);
        return;
      }

      // Cek apakah user memiliki permission MANAGE_GUILD (admin)
      if (interaction.member.permissions.has("MANAGE_GUILD")) {
        resolve(true);
        return;
      }

      // Cek apakah user memiliki role DJ
      const DJ = await dbService.musicbot.findOne({ guildID: interaction.guild.id });

      if (DJ && DJ.djRoles && DJ.djRoles.length > 0) {
        const djRoles = DJ.djRoles;
        const memberRoles = interaction.member.roles.cache.map(role => role.id);
        
        // Cek apakah user memiliki salah satu role DJ
        const hasDJRole = djRoles.some(role => memberRoles.includes(role));
        
        if (hasDJRole) {
          logger.debug(LOG_CATEGORY, `User ${interaction.user.tag} has DJ role`);
          resolve(true);
          return;
        }
      }
      
      // Default - tidak punya izin DJ
      resolve(false);
    } catch (error) {
      logger.error(LOG_CATEGORY, `Error checking DJ permission: ${error}`);
      resolve(false);
    }
  });
}

/**
 * Memeriksa apakah pengguna memiliki izin owner
 * 
 * @param {Client} client - Discord client
 * @param {Interaction} interaction - Discord interaction
 * @returns {boolean} True jika pengguna adalah owner
 */
function isOwner(client, interaction) {
  return config.ownerID.includes(interaction.member.id);
}

/**
 * Memeriksa apakah pengguna dapat memodifikasi playlist
 * 
 * @param {string} userId - ID pengguna
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<boolean>} True jika pengguna dapat memodifikasi playlist
 */
async function canManagePlaylist(userId, playlistName) {
  try {
    const isManageable = await dbService.playlist.isPlaylistManageable(userId, playlistName);
    return isManageable;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error checking playlist permission: ${error}`);
    return false;
  }
}

module.exports = {
  checkDJPermission,
  isOwner,
  canManagePlaylist
}; 