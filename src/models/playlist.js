/**
 * Playlist model untuk operasi playlist
 */

class Playlist {
  /**
   * Membuat instance playlist baru
   * 
   * @param {Object} data - Data playlist
   * @param {string} data.name - Nama playlist
   * @param {string} data.author - User ID pembuat playlist
   * @param {string} data.authorTag - User tag pembuat playlist
   * @param {boolean} data.public - Status akses playlist (public/private)
   * @param {number} data.plays - Jumlah pemutaran playlist
   * @param {number} data.createdTime - Waktu pembuatan (timestamp)
   * @param {string} data.guildId - ID guild tempat playlist dibuat
   */
  constructor(data = {}) {
    this.name = data.name || '';
    this.author = data.author || '';
    this.authorTag = data.authorTag || '';
    this.public = data.public === true;
    this.plays = data.plays || 0;
    this.createdTime = data.createdTime || Date.now();
    this.guildId = data.guildId || '';
  }

  /**
   * Validasi data playlist
   * @returns {boolean} Hasil validasi
   */
  isValid() {
    return Boolean(
      this.name && 
      this.name.length > 0 && 
      this.author && 
      this.author.length > 0
    );
  }

  /**
   * Convert to JSON untuk penyimpanan
   * @returns {Object} Data JSON
   */
  toJSON() {
    return {
      name: this.name,
      author: this.author,
      authorTag: this.authorTag,
      public: this.public,
      plays: this.plays,
      createdTime: this.createdTime,
      guildId: this.guildId
    };
  }

  /**
   * Buat instance dari JSON
   * 
   * @param {Object} json - JSON data
   * @returns {Playlist} Instance playlist
   */
  static fromJSON(json) {
    return new Playlist(json);
  }

  /**
   * Cek apakah user memiliki akses ke playlist
   * 
   * @param {string} userId - ID user yang ingin mengakses
   * @returns {boolean} - true jika user bisa mengakses
   */
  canAccess(userId) {
    // User adalah pemilik playlist atau playlist public
    return this.author === userId || this.public === true;
  }

  /**
   * Cek apakah user punya hak untuk mengedit playlist
   * 
   * @param {string} userId - ID user yang ingin mengedit
   * @returns {boolean} - true jika user bisa mengedit
   */
  canManage(userId) {
    // Hanya pemilik playlist yang bisa mengedit
    return this.author === userId;
  }
}

/**
 * Model untuk item musik dalam playlist
 */
class PlaylistItem {
  /**
   * Create a new playlist item
   * 
   * @param {Object} data - Data item
   * @param {string} data.playlist_name - Nama playlist
   * @param {string} data.music_name - Nama musik/lagu
   * @param {string} data.music_url - URL musik
   * @param {string} data.music_thumbnail - URL thumbnail
   * @param {number} data.music_duration - Durasi dalam detik
   * @param {string} data.music_source - Sumber musik (youtube, spotify, etc)
   * @param {number} data.saveTime - Waktu penambahan (timestamp)
   */
  constructor(data = {}) {
    this.playlist_name = data.playlist_name || '';
    this.music_name = data.music_name || '';
    this.music_url = data.music_url || '';
    this.music_thumbnail = data.music_thumbnail || '';
    this.music_duration = data.music_duration || 0;
    this.music_source = data.music_source || 'unknown';
    this.saveTime = data.saveTime || Date.now();
  }

  /**
   * Validasi item playlist
   * @returns {boolean} Hasil validasi
   */
  isValid() {
    return Boolean(
      this.playlist_name && 
      this.playlist_name.length > 0 && 
      this.music_name && 
      this.music_name.length > 0 && 
      this.music_url && 
      this.music_url.length > 0
    );
  }

  /**
   * Convert to JSON untuk penyimpanan
   * @returns {Object} Data JSON
   */
  toJSON() {
    return {
      playlist_name: this.playlist_name,
      music_name: this.music_name,
      music_url: this.music_url,
      music_thumbnail: this.music_thumbnail,
      music_duration: this.music_duration,
      music_source: this.music_source,
      saveTime: this.saveTime
    };
  }

  /**
   * Buat instance dari JSON
   * 
   * @param {Object} json - JSON data
   * @returns {PlaylistItem} Instance item playlist
   */
  static fromJSON(json) {
    return new PlaylistItem(json);
  }
}

module.exports = {
  Playlist,
  PlaylistItem
}; 