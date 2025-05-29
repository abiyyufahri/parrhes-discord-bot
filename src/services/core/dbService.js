/**
 * dbService.js - Core database service
 * Entry point untuk database
 */

// Import repositories
const playlistRepository = require('../../repositories/firestore/playlistRepository');
const musicbotRepository = require('../../repositories/firestore/musicbotRepository');
const logger = require('../../utils/logger');

const LOG_CATEGORY = 'DBService';

// Tambahkan pelacakan untuk mencegah panggilan duplikat
const pendingOperations = {
  createPlaylist: new Map()
};

// Export service
module.exports = {
  // Struktur untuk backward compatibility dengan kode yang menggunakan db.js
  server: {
    findOne: async (query) => {
      return await musicbotRepository.isGuildRegistered(query.guildID);
    }
  },
  
  playlist: {
    // Mendapatkan playlist milik user
    findOne: async (query) => {
      try {
        if (query.userID) {
          logger.debug(LOG_CATEGORY, `Finding playlists for user ${query.userID}`);
          // Teruskan guildId ke repository jika ada dalam query
          return await playlistRepository.getPlaylistsByUser(query.userID, query.guildID);
        }
        return null;
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in playlist.findOne: ${error.message}`);
        return null;
      }
    },
      // Mendapatkan semua playlist yang bisa diakses di guild tertentu
    find: async (query = {}) => {
      try {
        // Jika ada guildID, gunakan fungsi untuk mendapatkan playlist yang bisa diakses di guild
        if (query.guildID) {
          logger.debug(LOG_CATEGORY, `Finding accessible playlists in guild ${query.guildID}`);
          // getAccessiblePlaylists memerlukan userId dan guildId
          // Untuk find() tanpa userId, kita perlu mendapatkan semua playlist dan filter berdasarkan guild
          const allPlaylists = await playlistRepository.getAllPlaylists();
          const accessiblePlaylists = [];
          
          // Filter playlist berdasarkan guild untuk semua user
          allPlaylists.forEach(userPlaylist => {
            if (userPlaylist.playlist && Array.isArray(userPlaylist.playlist)) {
              const filteredPlaylists = userPlaylist.playlist.filter(playlist => {
                // Hanya tampilkan public playlist yang dibuat di server ini
                return playlist.public === true && playlist.guildId === query.guildID;
              });
              
              if (filteredPlaylists.length > 0) {
                accessiblePlaylists.push({
                  ...userPlaylist,
                  playlist: filteredPlaylists
                });
              }
            }
          });
          
          return accessiblePlaylists;
        }
        // Jika tidak ada filter, ambil semua playlist
        logger.debug(LOG_CATEGORY, 'Finding all playlists');
        return await playlistRepository.getAllPlaylists();
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in playlist.find: ${error.message}`);
        return [];
      }
    },
    
    // Menambah/menghapus data dari playlist
    updateOne: async (filter, update, options = {}) => {
      logger.debug(LOG_CATEGORY, `Updating playlist with filter: ${JSON.stringify(filter)}`);
      
      try {
        // Jika operasi $push
        if (update.$push && update.$push.playlist) {
          const { userID } = filter;
          const playlistData = update.$push.playlist;
          
          // Buat kunci unik untuk operasi ini
          const operationKey = `${userID}:${playlistData.name}`;
          
          // Periksa apakah operasi yang sama sedang berjalan
          if (pendingOperations.createPlaylist.has(operationKey)) {
            logger.debug(LOG_CATEGORY, `Duplicate playlist creation detected for key ${operationKey}. Skipping.`);
            return pendingOperations.createPlaylist.get(operationKey);
          }
            // Buat promise untuk operasi ini dan simpan di map
          const resultPromise = (async () => {
            // Langsung panggil createPlaylist dari repository
            const result = await playlistRepository.createPlaylist(
              userID,
              playlistData
            );
            
            return { modifiedCount: result ? 1 : 0 };
          })();
          
          // Simpan promise di map
          pendingOperations.createPlaylist.set(operationKey, resultPromise);
          
          // Tunggu hasil dan hapus dari map setelah selesai
          const result = await resultPromise;
          pendingOperations.createPlaylist.delete(operationKey);
          
          return result;
        } 
        // Jika operasi $pull untuk playlist
        else if (update.$pull && update.$pull.playlist) {
          const { userID } = filter;
          const playlistName = update.$pull.playlist.name;
          
          const result = await playlistRepository.deletePlaylist(userID, playlistName);
          return { modifiedCount: result ? 1 : 0 };
        }
        // Jika operasi $pull untuk musics
        else if (update.$pull && update.$pull.musics) {
          const { userID } = filter;
          
          // Ekstrak playlist name dan music name dari kriteria
          const { playlist_name, music_name } = update.$pull.musics;
          
          if (!playlist_name) {
            logger.error(LOG_CATEGORY, "Error: playlist_name is required for music deletion");
            return { modifiedCount: 0 };
          }
          
          try {
            // Jika music_name ada, hapus lagu spesifik
            if (music_name) {
              logger.debug(LOG_CATEGORY, `Removing specific music "${music_name}" from playlist "${playlist_name}"`);
              const result = await playlistRepository.removeMusicFromPlaylist(
                userID, 
                playlist_name,
                music_name
              );
              return { modifiedCount: result ? 1 : 0 };
            } 
            // Jika tidak ada music_name, hapus semua lagu dari playlist (saat playlist dihapus)
            else {              logger.debug(LOG_CATEGORY, `Removing all music from playlist "${playlist_name}"`);
              // Dapatkan daftar lagu di playlist
              const userPlaylist = await playlistRepository.getPlaylistsByUser(userID);
              
              if (userPlaylist && userPlaylist.musics) {
                const targetMusics = userPlaylist.musics.filter(m => m.playlist_name === playlist_name);
                logger.debug(LOG_CATEGORY, `Found ${targetMusics.length} songs to remove`);
                
                // Hapus satu per satu
                for (const music of targetMusics) {
                  await playlistRepository.removeMusicFromPlaylist(
                    userID, 
                    playlist_name,
                    music.music_name || music.music_title
                  );
                }
                
                return { modifiedCount: targetMusics.length };
              }
            }
          } catch (error) {
            logger.error(LOG_CATEGORY, `Error removing music from playlist: ${error.message}`);
          }
          
          return { modifiedCount: 0 };
        }
        // Jika operasi $push untuk menambahkan lagu ke playlist
        else if (update.$push && update.$push.musics) {
          const { userID } = filter;
          const musicData = update.$push.musics;
          
          logger.debug(LOG_CATEGORY, `Adding music to playlist: ${musicData.playlist_name}`);
          
          try {
            // Panggil repository untuk menambahkan lagu
            const result = await playlistRepository.addMusicToPlaylist(
              userID,
              musicData.playlist_name,
              musicData
            );
            
            return { modifiedCount: result ? 1 : 0 };
          } catch (error) {
            logger.error(LOG_CATEGORY, `Error adding music to playlist: ${error.message}`);
            return { modifiedCount: 0, error };
          }
        }
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in updateOne operation: ${error.message}`);
        return { modifiedCount: 0, error };
      }
      
      return { modifiedCount: 0 };
    },
    
    // Alias untuk updateOne
    findOneAndUpdate: async (filter, update, options = {}) => {
      return module.exports.playlist.updateOne(filter, update, options);
    },
    
    // Menghapus playlist
    deleteOne: async (filter) => {
      try {
        if (filter.userID) {
          const deleted = await playlistRepository.deletePlaylist(filter.userID, filter.name);
          return { deletedCount: deleted ? 1 : 0 };
        }
        return { deletedCount: 0 };
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in deleteOne: ${error.message}`);
        return { deletedCount: 0 };
      }
    },
    
    // Cek apakah user berhak mengelola playlist
    isPlaylistManageable: async (userId, playlistName) => {
      try {
        const result = await playlistRepository.isPlaylistManageable(userId, playlistName);
        return result;
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in isPlaylistManageable: ${error.message}`);
        return false;
      }
    }
  },
  
  // MusicBot collection - settings dll
  musicbot: {
    findOne: async (filter = {}) => {
      try {
        if (filter.guildID) {
          return await musicbotRepository.getGuildSettings(filter.guildID);
        }
        return null;
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in musicbot.findOne: ${error.message}`);
        return null;
      }
    },
    
    updateOne: async (filter, update, options = {}) => {
      try {
        if (filter.guildID && update.$set) {
          const result = await musicbotRepository.updateGuildSettings(filter.guildID, update.$set);
          return { modifiedCount: result ? 1 : 0 };
        } else if (filter.guildID && update.$push && update.$push.channels) {
          const result = await musicbotRepository.addChannelToGuild(filter.guildID, update.$push.channels);
          return { modifiedCount: result ? 1 : 0 };
        } else if (filter.guildID && update.$pull && update.$pull.channels) {
          const result = await musicbotRepository.removeChannelFromGuild(
            filter.guildID, 
            update.$pull.channels.channel
          );
          return { modifiedCount: result ? 1 : 0 };
        }
        return { modifiedCount: 0 };
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error in musicbot.updateOne: ${error.message}`);
        return { modifiedCount: 0 };
      }
    },
    
    // Alias untuk updateOne
    findOneAndUpdate: async (filter, update, options = {}) => {
      logger.debug(LOG_CATEGORY, `Calling findOneAndUpdate as alias for updateOne: ${JSON.stringify(filter)}`);
      return module.exports.musicbot.updateOne(filter, update, options);
    }
  }
}; 