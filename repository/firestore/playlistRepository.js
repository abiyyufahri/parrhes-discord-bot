/**
 * Playlist repository - Menangani operasi Firestore untuk playlist
 */
const { admin, firestoreAdmin } = require('../../firebaseConfig');
const { FieldValue } = admin.firestore;

// Referensi koleksi untuk playlist
// Gunakan nama koleksi 'playlist' (tanpa s) untuk kompatibilitas dengan kode lama
const playlistsCollection = firestoreAdmin.collection('playlist');
console.log('[PlaylistRepository] Using Firestore collection: playlist');

/**
 * Mendapatkan playlist user berdasarkan userID
 * @param {string} userId - ID user Discord
 * @returns {Promise<Object|null>} - Playlist user atau null jika tidak ditemukan
 */
const getPlaylistsByUser = async (userId) => {
  try {
    const doc = await playlistsCollection.doc(userId).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('[PlaylistRepository] Error getting playlist by user:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua playlist
 * @returns {Promise<Array>} - Array dari semua playlist
 */
const getAllPlaylists = async () => {
  try {
    const snapshot = await playlistsCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('[PlaylistRepository] Error getting all playlists:', error);
    throw error;
  }
};

/**
 * Membuat playlist baru
 * @param {string} userId - ID user Discord
 * @param {Object} playlistData - Data playlist
 * @returns {Promise<boolean>} - True jika berhasil
 */
const createPlaylist = async (userId, playlistData) => {
  try {
    console.log(`[PlaylistRepository] Creating playlist "${playlistData.name}" for user ${userId}`);
    
    // Tambahkan guildID ke data playlist
    const newPlaylist = {
      name: playlistData.name,
      author: playlistData.author || userId,
      authorTag: playlistData.authorTag,
      public: playlistData.public,
      plays: playlistData.plays || 0,
      createdTime: playlistData.createdTime || Date.now(),
      guildId: playlistData.guildId // Menyimpan ID server tempat playlist dibuat
    };
    
    console.log("[PlaylistRepository] newPlaylist object:", newPlaylist);
    
    // PERUBAHAN PENTING: Validasi nama playlist harus unik secara global
    // Cek apakah nama playlist sudah digunakan oleh siapapun
    const allPlaylists = await getAllPlaylists();
    
    // Flag untuk deteksi duplikasi playlist
    let isDuplicate = false;
    
    // Periksa di semua playlist yang ada
    for (const userData of allPlaylists) {
      // Skip jika tidak ada playlist atau bukan array
      if (!userData.playlist || !Array.isArray(userData.playlist)) {
        continue;
      }
      
      // Periksa apakah nama sudah ada di playlist ini
      if (userData.playlist.some(p => p.name === newPlaylist.name)) {
        isDuplicate = true;
        console.log(`[PlaylistRepository] Playlist name "${newPlaylist.name}" already exists globally`);
        break;
      }
    }
    
    if (isDuplicate) {
      return false;
    }
    
    // Jika lolos validasi duplikasi, buat atau update playlist
    const userDocRef = playlistsCollection.doc(userId);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      console.log(`[PlaylistRepository] User document exists, adding new playlist`);
      // Dapatkan array playlist yang ada
      const userData = userDoc.data();
      const currentPlaylists = userData.playlist || [];
      
      // Tambahkan playlist baru
      const updatedPlaylists = [...currentPlaylists, newPlaylist];
      
      // Update dokumen dengan array playlist yang baru
      await userDocRef.update({
        playlist: updatedPlaylists
      });
    } else {
      console.log(`[PlaylistRepository] Creating new user document with playlist`);
      // Buat dokumen baru jika belum ada
      await userDocRef.set({
        userID: userId,
        playlist: [newPlaylist],
        musics: []
      });
    }
    
    console.log(`[PlaylistRepository] Playlist created successfully`);
    return true;
  } catch (error) {
    console.error('[PlaylistRepository] Error creating playlist:', error);
    throw error;
  }
};

/**
 * Menghapus playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist yang akan dihapus
 * @returns {Promise<boolean>} - True jika berhasil
 */
const deletePlaylist = async (userId, playlistName) => {
  try {
    const userDocRef = playlistsCollection.doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const playlists = userData.playlist || [];
    const musics = userData.musics || [];
    
    // Filter out playlist dengan nama yang akan dihapus
    const newPlaylists = playlists.filter(p => p.name !== playlistName);
    
    // Filter out lagu-lagu yang terkait dengan playlist
    const newMusics = musics.filter(m => m.playlist_name !== playlistName);
    
    // Update dokumen dengan playlist dan lagu yang sudah difilter
    await userDocRef.update({
      playlist: newPlaylists,
      musics: newMusics
    });
    
    return true;
  } catch (error) {
    console.error('[PlaylistRepository] Error deleting playlist:', error);
    throw error;
  }
};

/**
 * Menambahkan lagu ke playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @param {Object} musicData - Data lagu
 * @returns {Promise<boolean>} - True jika berhasil
 */
const addMusicToPlaylist = async (userId, playlistName, musicData) => {
  try {
    console.log(`[PlaylistRepository] Adding music to playlist "${playlistName}" for user ${userId}`);
    
    const userDocRef = playlistsCollection.doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log(`[PlaylistRepository] User document does not exist`);
      return false;
    }
    
    // Menyiapkan data musik
    const music = {
      ...musicData,
      playlist_name: playlistName,
      added_by: userId
    };
    
    console.log(`[PlaylistRepository] Music data:`, music);
    
    // Dapatkan data user yang ada
    const userData = userDoc.data();
    const currentMusics = userData.musics || [];
    
    // Tambahkan musik baru ke array
    const updatedMusics = [...currentMusics, music];
    
    // Update dokumen dengan array musik yang baru
    await userDocRef.update({
      musics: updatedMusics
    });
    
    console.log(`[PlaylistRepository] Music added successfully`);
    return true;
  } catch (error) {
    console.error('[PlaylistRepository] Error adding music to playlist:', error);
    throw error;
  }
};

/**
 * Menghapus lagu dari playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @param {string} musicName - Nama lagu
 * @returns {Promise<boolean>} - True jika berhasil
 */
const removeMusicFromPlaylist = async (userId, playlistName, musicName) => {
  try {
    const userDocRef = playlistsCollection.doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const musics = userData.musics || [];
    
    // Filter lagu yang ingin dihapus
    const newMusics = musics.filter(m => 
      !(m.playlist_name === playlistName && 
        (m.music_name === musicName || m.music_title === musicName))
    );
    
    // Update dokumen dengan array musik yang baru
    await userDocRef.update({
      musics: newMusics
    });
    
    return true;
  } catch (error) {
    console.error('[PlaylistRepository] Error removing music from playlist:', error);
    throw error;
  }
};

/**
 * Memperbarui jumlah pemutaran playlist
 * @param {string} userId - ID user Discord
 * @param {string} playlistName - Nama playlist
 * @returns {Promise<boolean>} - True jika berhasil
 */
const incrementPlaylistPlays = async (userId, playlistName) => {
  try {
    const userDocRef = playlistsCollection.doc(userId);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const playlists = userData.playlist || [];
    
    // Temukan playlist yang ingin diperbarui
    const updatedPlaylists = playlists.map(p => {
      if (p.name === playlistName) {
        return { ...p, plays: (p.plays || 0) + 1 };
      }
      return p;
    });
    
    // Update dokumen dengan playlist yang telah diperbarui
    await userDocRef.update({
      playlist: updatedPlaylists
    });
    
    return true;
  } catch (error) {
    console.error('[PlaylistRepository] Error incrementing playlist plays:', error);
    throw error;
  }
};

/**
 * Mendapatkan semua playlist yang dapat diakses oleh user di server tertentu
 * @param {string} userId - ID user Discord
 * @param {string} guildId - ID server Discord
 * @returns {Promise<Array>} - Array playlist yang dapat diakses
 */
const getAccessiblePlaylists = async (userId, guildId) => {
  try {
    console.log(`[PlaylistRepository] Getting accessible playlists for user ${userId} in guild ${guildId}`);
    const allPlaylists = await getAllPlaylists();
    const accessiblePlaylists = [];
    
    // Untuk tiap data user
    for (const userPlaylist of allPlaylists) {
      // Skip jika tidak ada playlist atau bukan array
      if (!userPlaylist.playlist || !Array.isArray(userPlaylist.playlist)) {
        continue;
      }
      
      // Filter playlist yang bisa diakses:
      // 1. Playlist milik user sendiri: semua bisa diakses (baik public maupun private)
      // 2. Playlist milik user lain: hanya yang public DAN dibuat di server ini
      const isOwner = userPlaylist.userID === userId || userPlaylist.id === userId;
      
      // Filter playlist berdasarkan aturan akses
      const filteredPlaylists = userPlaylist.playlist.filter(playlist => {
        if (isOwner) {
          // Playlist milik user:
          // - Private playlist bisa diakses di mana saja
          // - Public playlist hanya bisa diakses di server tempat dibuat
          return playlist.public === false || (playlist.public === true && playlist.guildId === guildId);
        } else {
          // Playlist user lain: hanya playlist public dan dibuat di server ini
          return playlist.public === true && playlist.guildId === guildId;
        }
      });
      
      // Tambahkan ke hasil jika ada playlist yang bisa diakses
      if (filteredPlaylists.length > 0) {
        accessiblePlaylists.push({
          ...userPlaylist,
          playlist: filteredPlaylists
        });
      }
    }
    
    return accessiblePlaylists;
  } catch (error) {
    console.error('[PlaylistRepository] Error getting accessible playlists:', error);
    throw error;
  }
};

module.exports = {
  getPlaylistsByUser,
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  addMusicToPlaylist,
  removeMusicFromPlaylist,
  incrementPlaylistPlays,
  getAccessiblePlaylists
}; 