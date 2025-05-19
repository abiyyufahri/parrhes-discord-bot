/**
 * Service layer untuk playlist
 * Menghubungkan command dengan repository
 */
const playlistRepository = require('../repository/firestore/playlistRepository');

/**
 * Mendapatkan playlist milik user beserta lagu-lagunya
 * @param {string} userId - ID user Discord
 * @param {string} guildId - ID server Discord (opsional)
 * @returns {Promise<Object|null>} - Playlist user atau null jika tidak ditemukan
 */
const getUserPlaylists = async (userId, guildId = null) => {
  try {
    const userPlaylists = await playlistRepository.getPlaylistsByUser(userId);
    
    // Jika guildId disediakan, filter playlist yang bisa diakses
    if (guildId && userPlaylists) {
      // Untuk playlist milik user, terapkan aturan:
      // - Private playlist (public=false) bisa diakses user di server manapun
      // - Public playlist (public=true) hanya bisa diakses di server tempat dibuat
      if (userPlaylists.playlist && Array.isArray(userPlaylists.playlist)) {
        userPlaylists.playlist = userPlaylists.playlist.filter(playlist => {
          if (playlist.public === false) {
            return true; // Private playlist bisa diakses di mana saja
          } else {
            return playlist.guildId === guildId; // Public playlist hanya di server tempat dibuat
          }
        });
      }
    }
    
    return userPlaylists;
  } catch (error) {
    console.error('[PlaylistService] Error getting user playlists:', error);
    return null;
  }
};

/**
 * Mendapatkan semua playlist
 * @returns {Promise<Array>} - Semua playlist
 */
const getAllPlaylists = async () => {
  try {
    return await playlistRepository.getAllPlaylists();
  } catch (error) {
    console.error('[PlaylistService] Error getting all playlists:', error);
    return [];
  }
};

/**
 * Mendapatkan semua playlist yang dapat diakses di server tertentu
 * @param {string} guildId - ID server Discord
 * @returns {Promise<Array>} - Array semua playlist yang dapat diakses
 */
const getAccessiblePlaylistsInGuild = async (guildId) => {
  try {
    const allPlaylists = await playlistRepository.getAllPlaylists();
    const accessiblePlaylists = [];
    
    // Untuk semua playlist, terapkan aturan:
    // - Private playlist hanya bisa diakses oleh pemiliknya
    // - Public playlist hanya bisa diakses di server tempat dibuat
    allPlaylists.forEach(userPlaylist => {
      if (userPlaylist.playlist && Array.isArray(userPlaylist.playlist)) {
        const filteredPlaylists = userPlaylist.playlist.filter(playlist => {
          // Hanya tampilkan public playlist yang dibuat di server ini
          return playlist.public === true && playlist.guildId === guildId;
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
  } catch (error) {
    console.error('[PlaylistService] Error getting accessible playlists in guild:', error);
    return [];
  }
};

/**
 * Membuat playlist baru
 * @param {string} userId - ID user Discord
 * @param {string} name - Nama playlist
 * @param {boolean} isPublic - Status publik playlist
 * @param {string} authorTag - Tag author (username#discriminator)
 * @param {string} guildId - ID server tempat playlist dibuat
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const createPlaylist = async (userId, name, isPublic, authorTag, guildId) => {
  try {
    const playlistData = {
      name,
      author: userId,
      authorTag: authorTag,
      public: isPublic,
      plays: 0,
      createdTime: Date.now(),
      guildId: guildId // Tambahkan ID server ke data playlist
    };
    
    return await playlistRepository.createPlaylist(userId, playlistData);
  } catch (error) {
    console.error('[PlaylistService] Error creating playlist:', error);
    return false;
  }
};

/**
 * Menghapus playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist yang akan dihapus
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const deletePlaylist = async (userId, playlistName) => {
  try {
    return await playlistRepository.deletePlaylist(userId, playlistName);
  } catch (error) {
    console.error('[PlaylistService] Error deleting playlist:', error);
    return false;
  }
};

/**
 * Mengecek apakah playlist dimiliki oleh user
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<boolean>} - True jika playlist dimiliki oleh user
 */
const isPlaylistOwnedByUser = async (userId, playlistName) => {
  try {
    const userPlaylist = await playlistRepository.getPlaylistsByUser(userId);
    
    if (!userPlaylist || !userPlaylist.playlist) {
      return false;
    }
    
    return userPlaylist.playlist.some(p => p.name === playlistName);
  } catch (error) {
    console.error('[PlaylistService] Error checking playlist ownership:', error);
    return false;
  }
};

/**
 * Mengecek apakah playlist ada
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<{exists: boolean, userId: string|null, isPublic: boolean}>} - Info playlist
 */
const checkPlaylistExists = async (playlistName) => {
  try {
    const allPlaylists = await playlistRepository.getAllPlaylists();
    
    for (const playlist of allPlaylists) {
      const foundPlaylist = (playlist.playlist || []).find(p => p.name === playlistName);
      
      if (foundPlaylist) {
        return {
          exists: true,
          userId: foundPlaylist.author,
          isPublic: foundPlaylist.public
        };
      }
    }
    
    return { exists: false, userId: null, isPublic: false };
  } catch (error) {
    console.error('[PlaylistService] Error checking if playlist exists:', error);
    return { exists: false, userId: null, isPublic: false };
  }
};

/**
 * Menambahkan lagu ke playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @param {Object} musicData - Data lagu
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const addMusicToPlaylist = async (userId, playlistName, musicData) => {
  try {
    return await playlistRepository.addMusicToPlaylist(userId, playlistName, musicData);
  } catch (error) {
    console.error('[PlaylistService] Error adding music to playlist:', error);
    return false;
  }
};

/**
 * Menghapus lagu dari playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @param {string} musicName - Nama lagu
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const removeMusicFromPlaylist = async (userId, playlistName, musicName) => {
  try {
    return await playlistRepository.removeMusicFromPlaylist(userId, playlistName, musicName);
  } catch (error) {
    console.error('[PlaylistService] Error removing music from playlist:', error);
    return false;
  }
};

/**
 * Mendapatkan lagu-lagu dalam playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<Array>} - Array lagu dalam playlist
 */
const getPlaylistSongs = async (userId, playlistName) => {
  try {
    const userPlaylist = await playlistRepository.getPlaylistsByUser(userId);
    
    if (!userPlaylist || !userPlaylist.musics) {
      return [];
    }
    
    return userPlaylist.musics.filter(m => m.playlist_name === playlistName);
  } catch (error) {
    console.error('[PlaylistService] Error getting playlist songs:', error);
    return [];
  }
};

/**
 * Mendapatkan playlist terpopuler
 * @param {number} limit - Jumlah playlist yang akan diambil
 * @returns {Promise<Array>} - Array playlist terurut berdasarkan plays
 */
const getTopPlaylists = async (limit = 10) => {
  try {
    const allPlaylists = await playlistRepository.getAllPlaylists();
    const flatPlaylists = [];
    
    // Flatten nested playlist structure
    allPlaylists.forEach(userPlaylist => {
      if (userPlaylist.playlist && Array.isArray(userPlaylist.playlist)) {
        userPlaylist.playlist.forEach(playlist => {
          if (playlist.public) { // Hanya tampilkan playlist publik
            flatPlaylists.push({
              ...playlist,
              userId: userPlaylist.userID || userPlaylist.id
            });
          }
        });
      }
    });
    
    // Sort by plays (descending)
    return flatPlaylists
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, limit);
  } catch (error) {
    console.error('[PlaylistService] Error getting top playlists:', error);
    return [];
  }
};

/**
 * Menambahkan jumlah plays pada playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<boolean>} - Status keberhasilan
 */
const incrementPlaylistPlays = async (userId, playlistName) => {
  try {
    return await playlistRepository.incrementPlaylistPlays(userId, playlistName);
  } catch (error) {
    console.error('[PlaylistService] Error incrementing playlist plays:', error);
    return false;
  }
};

/**
 * Mengecek apakah user memiliki hak untuk mengelola playlist
 * (hanya pemilik playlist yang bisa mengelola, terlepas dari status public/private)
 * @param {string} userId - ID user Discord yang akan mengakses
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<boolean>} - True jika user berhak mengelola playlist
 */
const isPlaylistManageable = async (userId, playlistName) => {
  try {
    console.log(`[PlaylistService] Checking management rights for user ${userId} on playlist "${playlistName}"`);
    // Cari informasi playlist dari semua user
    const allPlaylists = await playlistRepository.getAllPlaylists();
    
    // Cari playlist dengan nama yang sesuai
    for (const userPlaylists of allPlaylists) {
      const foundPlaylist = (userPlaylists.playlist || []).find(p => p.name === playlistName);
      
      if (foundPlaylist) {
        // Cek apakah user adalah pemilik playlist
        const isOwner = foundPlaylist.author === userId;
        console.log(`[PlaylistService] Playlist "${playlistName}" found, owned by ${foundPlaylist.author}, requesting user: ${userId}, isOwner: ${isOwner}`);
        return isOwner;
      }
    }
    
    console.log(`[PlaylistService] Playlist "${playlistName}" not found`);
    return false;
  } catch (error) {
    console.error('[PlaylistService] Error checking playlist management rights:', error);
    return false;
  }
};

/**
 * Mengecek informasi playlist secara lengkap
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<{exists: boolean, userId: string|null, authorTag: string|null, isPublic: boolean, guildId: string|null}>} - Info playlist
 */
const getPlaylistInfo = async (playlistName) => {
  try {
    const allPlaylists = await playlistRepository.getAllPlaylists();
    
    for (const playlist of allPlaylists) {
      const foundPlaylist = (playlist.playlist || []).find(p => p.name === playlistName);
      
      if (foundPlaylist) {
        return {
          exists: true,
          userId: foundPlaylist.author,
          authorTag: foundPlaylist.authorTag,
          isPublic: foundPlaylist.public,
          guildId: foundPlaylist.guildId,
          createdTime: foundPlaylist.createdTime
        };
      }
    }
    
    return { 
      exists: false, 
      userId: null, 
      authorTag: null, 
      isPublic: false, 
      guildId: null,
      createdTime: null
    };
  } catch (error) {
    console.error('[PlaylistService] Error getting playlist info:', error);
    return { 
      exists: false, 
      userId: null, 
      authorTag: null, 
      isPublic: false,
      guildId: null,
      createdTime: null
    };
  }
};

module.exports = {
  getUserPlaylists,
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  isPlaylistOwnedByUser,
  checkPlaylistExists,
  addMusicToPlaylist,
  removeMusicFromPlaylist,
  getPlaylistSongs,
  getTopPlaylists,
  incrementPlaylistPlays,
  getAccessiblePlaylistsInGuild,
  isPlaylistManageable,
  getPlaylistInfo
}; 