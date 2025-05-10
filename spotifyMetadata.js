/**
 * Modul fungsi untuk mengambil metadata Spotify
 * Mendukung track, playlist, dan album
 */
const axios = require('axios');

/**
 * Mendapatkan access token Spotify menggunakan client credentials
 * @param {Object} config - Konfigurasi Spotify (clientId dan clientSecret)
 * @returns {Promise<string>} - Access token
 */
async function getSpotifyToken(config) {
    try {
        // Gunakan client credentials dari config
        const clientId = config.spotify?.clientId;
        const clientSecret = config.spotify?.clientSecret;
        
        if (!clientId || !clientSecret) {
            throw new Error("Spotify client ID atau client secret tidak tersedia");
        }
        
        // Encode credentials untuk basic auth
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        // Request token using client credentials flow
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: 'grant_type=client_credentials'
        });
        
        return response.data.access_token;
    } catch (error) {
        console.error("Error mendapatkan Spotify token:", error.message);
        throw new Error(`Gagal mendapatkan token Spotify: ${error.message}`);
    }
}

/**
 * Ekstrak ID Spotify dari URL
 * @param {string} url - URL Spotify
 * @returns {Object} - Tipe dan ID
 */
function extractSpotifyId(url) {
    let type = null;
    let id = null;
    
    if (!url || typeof url !== 'string') {
        throw new Error("URL tidak valid");
    }
    
    // Cek dan ekstrak ID dari URL track
    if (url.includes('spotify.com/track/')) {
        type = 'track';
        id = url.split('track/')[1]?.split('?')[0];
    } 
    // Cek dan ekstrak ID dari URL playlist
    else if (url.includes('spotify.com/playlist/')) {
        type = 'playlist';
        id = url.split('playlist/')[1]?.split('?')[0];
    } 
    // Cek dan ekstrak ID dari URL album
    else if (url.includes('spotify.com/album/')) {
        type = 'album';
        id = url.split('album/')[1]?.split('?')[0];
    }
    
    if (!id) {
        throw new Error("Tidak dapat mengekstrak ID dari URL Spotify");
    }
    
    return { type, id };
}

/**
 * Dapatkan metadata track dari Spotify
 * @param {string} trackId - ID track Spotify
 * @param {string} token - Access token Spotify
 * @param {string} [market='US'] - Kode pasar (optional)
 * @returns {Promise<Object>} - Metadata track
 */
async function getTrackMetadata(trackId, token, market = 'US') {
    try {
        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/tracks/${trackId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                market: market
            }
        });
        
        const track = response.data;
        
        // Format data yang kembali untuk kemudahan penggunaan
        return {
            type: 'track',
            id: track.id,
            name: track.name,
            artists: track.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                uri: artist.uri
            })),
            artistNames: track.artists.map(artist => artist.name).join(', '),
            album: {
                id: track.album.id,
                name: track.album.name,
                releaseDate: track.album.release_date,
                totalTracks: track.album.total_tracks,
                images: track.album.images
            },
            duration: track.duration_ms,
            durationFormatted: formatDuration(track.duration_ms),
            popularity: track.popularity,
            explicit: track.explicit,
            previewUrl: track.preview_url,
            spotifyUrl: track.external_urls.spotify,
            uri: track.uri,
            isrc: track.external_ids?.isrc
        };
    } catch (error) {
        console.error("Error mengambil metadata track:", error.message);
        throw new Error(`Gagal mengambil metadata track: ${error.message}`);
    }
}

/**
 * Dapatkan metadata playlist dari Spotify
 * @param {string} playlistId - ID playlist Spotify
 * @param {string} token - Access token Spotify
 * @param {string} [market='US'] - Kode pasar (optional)
 * @param {number} [limit=50] - Jumlah track yang dimuat
 * @returns {Promise<Object>} - Metadata playlist
 */
async function getPlaylistMetadata(playlistId, token, market = 'US', limit = 50) {
    try {
        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/playlists/${playlistId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                market: market,
                fields: 'id,name,description,owner,images,tracks.total,tracks.items(added_at,track(id,name,artists,album(name,images),duration_ms,explicit,external_urls,uri))',
                limit: limit
            }
        });
        
        const playlist = response.data;
        
        // Format data yang kembali untuk kemudahan penggunaan
        return {
            type: 'playlist',
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            owner: {
                id: playlist.owner.id,
                name: playlist.owner.display_name
            },
            images: playlist.images,
            totalTracks: playlist.tracks.total,
            tracks: playlist.tracks.items.map(item => ({
                addedAt: item.added_at,
                id: item.track?.id,
                name: item.track?.name,
                artists: item.track?.artists.map(artist => artist.name).join(', '),
                album: item.track?.album.name,
                duration: item.track?.duration_ms,
                durationFormatted: formatDuration(item.track?.duration_ms),
                explicit: item.track?.explicit,
                spotifyUrl: item.track?.external_urls?.spotify,
                uri: item.track?.uri,
                imageUrl: item.track?.album?.images?.[0]?.url
            })).filter(track => track.id), // Filter null tracks (dapat terjadi jika track tidak tersedia di pasar tertentu)
            spotifyUrl: playlist.external_urls?.spotify,
            uri: playlist.uri
        };
    } catch (error) {
        console.error("Error mengambil metadata playlist:", error.message);
        throw new Error(`Gagal mengambil metadata playlist: ${error.message}`);
    }
}

/**
 * Dapatkan metadata album dari Spotify
 * @param {string} albumId - ID album Spotify
 * @param {string} token - Access token Spotify
 * @param {string} [market='US'] - Kode pasar (optional)
 * @returns {Promise<Object>} - Metadata album
 */
async function getAlbumMetadata(albumId, token, market = 'US') {
    try {
        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/albums/${albumId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            params: {
                market: market
            }
        });
        
        const album = response.data;
        
        // Format data yang kembali untuk kemudahan penggunaan
        return {
            type: 'album',
            id: album.id,
            name: album.name,
            artists: album.artists.map(artist => ({
                id: artist.id,
                name: artist.name,
                uri: artist.uri
            })),
            artistNames: album.artists.map(artist => artist.name).join(', '),
            releaseDate: album.release_date,
            releaseDatePrecision: album.release_date_precision,
            totalTracks: album.total_tracks,
            images: album.images,
            genres: album.genres,
            popularity: album.popularity,
            label: album.label,
            copyrights: album.copyrights,
            tracks: album.tracks.items.map(track => ({
                id: track.id,
                name: track.name,
                artists: track.artists.map(artist => artist.name).join(', '),
                trackNumber: track.track_number,
                discNumber: track.disc_number,
                duration: track.duration_ms,
                durationFormatted: formatDuration(track.duration_ms),
                explicit: track.explicit,
                spotifyUrl: track.external_urls?.spotify,
                uri: track.uri
            })),
            spotifyUrl: album.external_urls?.spotify,
            uri: album.uri
        };
    } catch (error) {
        console.error("Error mengambil metadata album:", error.message);
        throw new Error(`Gagal mengambil metadata album: ${error.message}`);
    }
}

/**
 * Mendapatkan metadata Spotify dari URL
 * @param {string} url - URL Spotify (track, playlist, atau album)
 * @param {Object} config - Konfigurasi Spotify
 * @param {string} [market='US'] - Kode pasar (optional)
 * @returns {Promise<Object>} - Metadata
 */
async function getSpotifyMetadata(url, config, market = 'US') {
    try {
        // Dapatkan token
        const token = await getSpotifyToken(config);
        
        // Ekstrak jenis dan ID dari URL
        const { type, id } = extractSpotifyId(url);
        
        // Ambil metadata berdasarkan jenis
        switch (type) {
            case 'track':
                return await getTrackMetadata(id, token, market);
            case 'playlist':
                return await getPlaylistMetadata(id, token, market);
            case 'album':
                return await getAlbumMetadata(id, token, market);
            default:
                throw new Error("Jenis URL Spotify tidak didukung");
        }
    } catch (error) {
        console.error("Error di getSpotifyMetadata:", error.message);
        throw error;
    }
}

/**
 * Format durasi dari milidetik ke format waktu
 * @param {number} ms - Durasi dalam milidetik
 * @returns {string} - Format waktu MM:SS atau HH:MM:SS
 */
function formatDuration(ms) {
    if (!ms) return '0:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = {
    getSpotifyMetadata,
    getTrackMetadata,
    getPlaylistMetadata,
    getAlbumMetadata,
    getSpotifyToken,
    extractSpotifyId
};