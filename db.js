/**
 * db.js - Entry point untuk database
 * Menggantikan mongoDB.js dengan pendekatan service-oriented
 */

// Import services
const playlistService = require('./services/playlistService');
const musicbotService = require('./services/musicbotService');

// Tambahkan pelacakan untuk mencegah panggilan duplikat
const pendingOperations = {
  createPlaylist: new Map()
};

// Export untuk backward compatibility
module.exports = {
  // Struktur untuk backward compatibility dengan kode yang menggunakan mongoDB.js
  playlist: {
    // Mendapatkan playlist milik user
    findOne: async (query) => {
      if (query.userID) {
        // Teruskan guildId ke service jika ada dalam query
        return await playlistService.getUserPlaylists(query.userID, query.guildID);
      }
      return null;
    },
    
    // Mendapatkan semua playlist yang bisa diakses di guild tertentu
    find: async (query = {}) => {
      // Jika ada guildID, gunakan fungsi untuk mendapatkan playlist yang bisa diakses di guild
      if (query.guildID) {
        return await playlistService.getAccessiblePlaylistsInGuild(query.guildID);
      }
      // Jika tidak ada filter, ambil semua playlist
      return await playlistService.getAllPlaylists();
    },
    
    // Menambah/menghapus data dari playlist
    updateOne: async (filter, update, options = {}) => {
      console.log("[DB] updateOne called with:", { filter, update, options });
      // Jika operasi $push
      if (update.$push && update.$push.playlist) {
        const { userID } = filter;
        const playlistData = update.$push.playlist;
        
        // Buat kunci unik untuk operasi ini
        const operationKey = `${userID}:${playlistData.name}`;
        
        // Periksa apakah operasi yang sama sedang berjalan
        if (pendingOperations.createPlaylist.has(operationKey)) {
          console.log(`[DB] Duplicate playlist creation detected for key ${operationKey}. Skipping.`);
          return pendingOperations.createPlaylist.get(operationKey);
        }
        
        // Log pertama untuk debugging
        console.log("[DB] Creating playlist with:", {
          userId: userID,
          name: playlistData.name,
          isPublic: playlistData.public,
          authorTag: playlistData.authorTag,
          guildId: playlistData.guildId
        });
        
        try {
          // Buat promise untuk operasi ini dan simpan di map
          const resultPromise = (async () => {
            // Langsung panggil createPlaylist dari service
            const result = await playlistService.createPlaylist(
              userID,
              playlistData.name,
              playlistData.public,
              playlistData.authorTag,
              playlistData.guildId
            );
            
            console.log(`[DB] Playlist creation result: ${result}`);
            return { modifiedCount: result ? 1 : 0 };
          })();
          
          // Simpan promise di map
          pendingOperations.createPlaylist.set(operationKey, resultPromise);
          
          // Tunggu hasil dan hapus dari map setelah selesai
          const result = await resultPromise;
          pendingOperations.createPlaylist.delete(operationKey);
          
          return result;
        } catch (error) {
          console.error("[DB] Error creating playlist:", error);
          // Hapus dari map jika terjadi error
          pendingOperations.createPlaylist.delete(operationKey);
          return { modifiedCount: 0, error };
        }
      } 
      // Jika operasi $pull untuk playlist
      else if (update.$pull && update.$pull.playlist) {
        const { userID } = filter;
        const playlistName = update.$pull.playlist.name;
        
        const result = await playlistService.deletePlaylist(userID, playlistName);
        return { modifiedCount: result ? 1 : 0 };
      }
      // Jika operasi $pull untuk musics
      else if (update.$pull && update.$pull.musics) {
        const { userID } = filter;
        
        // Log first untuk debugging
        console.log("[DB] Removing music from playlist with criteria:", update.$pull.musics);
        
        // Ekstrak playlist name dan music name dari kriteria
        const { playlist_name, music_name } = update.$pull.musics;
        
        if (!playlist_name) {
          console.error("[DB] Error: playlist_name is required for music deletion");
          return { modifiedCount: 0 };
        }
        
        try {
          // Jika music_name ada, hapus lagu spesifik
          if (music_name) {
            console.log(`[DB] Removing specific music "${music_name}" from playlist "${playlist_name}"`);
            const result = await playlistService.removeMusicFromPlaylist(
              userID, 
              playlist_name,
              music_name
            );
            return { modifiedCount: result ? 1 : 0 };
          } 
          // Jika tidak ada music_name, hapus semua lagu dari playlist (saat playlist dihapus)
          else {
            console.log(`[DB] Removing all music from playlist "${playlist_name}"`);
            // Dapatkan daftar lagu di playlist
            const userPlaylist = await playlistService.getUserPlaylists(userID);
            
            if (userPlaylist && userPlaylist.musics) {
              const targetMusics = userPlaylist.musics.filter(m => m.playlist_name === playlist_name);
              console.log(`[DB] Found ${targetMusics.length} songs to remove`);
              
              // Hapus satu per satu
              for (const music of targetMusics) {
                await playlistService.removeMusicFromPlaylist(
                  userID, 
                  playlist_name,
                  music.music_name || music.music_title
                );
              }
              
              return { modifiedCount: targetMusics.length };
            }
          }
        } catch (error) {
          console.error("[DB] Error removing music from playlist:", error);
        }
        
        return { modifiedCount: 0 };
      }
      // Jika operasi $push untuk menambahkan lagu ke playlist
      else if (update.$push && update.$push.musics) {
        const { userID } = filter;
        const musicData = update.$push.musics;
        
        console.log("[DB] Adding music to playlist:", {
          userId: userID,
          playlistName: musicData.playlist_name,
          musicName: musicData.music_name || musicData.music_title
        });
        
        try {
          // Panggil service untuk menambahkan lagu
          const result = await playlistService.addMusicToPlaylist(
            userID,
            musicData.playlist_name,
            musicData
          );
          
          console.log(`[DB] Music addition result: ${result}`);
          return { modifiedCount: result ? 1 : 0 };
        } catch (error) {
          console.error("[DB] Error adding music to playlist:", error);
          return { modifiedCount: 0, error };
        }
      }
      
      return { modifiedCount: 0 };
    },
    
    // Alias untuk updateOne
    findOneAndUpdate: async (filter, update, options = {}) => {
      return module.exports.playlist.updateOne(filter, update, options);
    },
    
    // Menghapus playlist
    deleteOne: async (filter) => {
      if (filter.userID) {
        const deleted = await playlistService.deletePlaylist(filter.userID, filter.name);
        return { deletedCount: deleted ? 1 : 0 };
      }
      return { deletedCount: 0 };
    },
    
    // Mengecek apakah user berhak mengelola playlist
    isPlaylistManageable: async (userId, playlistName) => {
      return await playlistService.isPlaylistManageable(userId, playlistName);
    },
    
    // Mendapatkan informasi playlist
    getPlaylistInfo: async (playlistName) => {
      return await playlistService.getPlaylistInfo(playlistName);
    }
  },
  
  // Struktur untuk backward compatibility dengan kode yang menggunakan mongoDB.js
  musicbot: {
    // Mendapatkan setting guild
    findOne: async (query) => {
      if (query.guildID) {
        return await musicbotService.getGuildSettings(query.guildID);
      }
      return null;
    },
    
    // Mendapatkan semua setting guild
    find: async () => {
      // Ini akan mengembalikan array kosong karena kita tidak menyediakan fungsi getAllGuildSettings
      return [];
    },
    
    // Update setting guild
    updateOne: async (filter, update, options = {}) => {
      if (filter.guildID) {
        const guildID = filter.guildID;
        
        // Jika $set
        if (update.$set) {
          const settings = update.$set;
          
          // Khusus untuk update bahasa
          if (settings.language) {
            const result = await musicbotService.saveGuildLanguage(guildID, settings.language);
            return { modifiedCount: result ? 1 : 0 };
          }
          
          // Khusus untuk update channel DJ
          if (settings.djChannel) {
            const result = await musicbotService.saveDJChannel(guildID, settings.djChannel);
            return { modifiedCount: result ? 1 : 0 };
          }
          
          // Khusus untuk update role DJ
          if (settings.djRole) {
            const result = await musicbotService.saveDJRole(guildID, settings.djRole);
            return { modifiedCount: result ? 1 : 0 };
          }
          
          // Khusus untuk update channel musik
          if (settings.musicChannel) {
            const result = await musicbotService.saveDefaultMusicChannel(guildID, settings.musicChannel);
            return { modifiedCount: result ? 1 : 0 };
          }
        }
      }
      
      return { modifiedCount: 0 };
    },
    
    // Alias untuk updateOne
    findOneAndUpdate: async (filter, update, options = {}) => {
      return module.exports.musicbot.updateOne(filter, update, options);
    },
    
    // Menghapus setting guild
    deleteOne: async (filter) => {
      if (filter.guildID) {
        const deleted = await musicbotService.resetGuildSettings(filter.guildID);
        return { deletedCount: deleted ? 1 : 0 };
      }
      return { deletedCount: 0 };
    }
  }
}; 