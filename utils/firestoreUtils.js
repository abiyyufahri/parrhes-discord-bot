// Utilities for Firestore operations
const { firestoreAdmin } = require('../firebaseConfig');
const config = require('../config');

// Collection references
const serversCollection = firestoreAdmin.collection('servers');
const playlistsCollection = firestoreAdmin.collection('playlists');
const usersCollection = firestoreAdmin.collection('users');

/**
 * Convert Firestore Document to plain object
 */
const docToObj = (doc) => {
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

/**
 * Convert Firestore QuerySnapshot to array of objects
 */
const queryToArray = (querySnapshot) => {
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Get Server Data
 */
const getServer = async (serverId) => {
  try {
    const serverDoc = await serversCollection.doc(serverId).get();
    return docToObj(serverDoc);
  } catch (error) {
    console.error(`Error getting server ${serverId}:`, error);
    return null;
  }
};

/**
 * Create or Update Server
 */
const saveServer = async (serverId, data) => {
  try {
    await serversCollection.doc(serverId).set(data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving server ${serverId}:`, error);
    return false;
  }
};

/**
 * Get User Playlists
 */
const getUserPlaylists = async (userId) => {
  try {
    const playlistsQuery = await playlistsCollection
      .where('userId', '==', userId)
      .get();
    
    return queryToArray(playlistsQuery);
  } catch (error) {
    console.error(`Error getting playlists for user ${userId}:`, error);
    return [];
  }
};

/**
 * Get Playlist by ID
 */
const getPlaylist = async (playlistId) => {
  try {
    const playlistDoc = await playlistsCollection.doc(playlistId).get();
    return docToObj(playlistDoc);
  } catch (error) {
    console.error(`Error getting playlist ${playlistId}:`, error);
    return null;
  }
};

/**
 * Create New Playlist
 */
const createPlaylist = async (playlistData) => {
  try {
    // Check max playlist limit
    if (config.playlistSettings.maxPlaylist > 0) {
      const userPlaylists = await getUserPlaylists(playlistData.userId);
      if (userPlaylists.length >= config.playlistSettings.maxPlaylist) {
        return { success: false, error: 'MAX_PLAYLIST_LIMIT' };
      }
    }

    const newPlaylistRef = playlistsCollection.doc();
    await newPlaylistRef.set({
      ...playlistData,
      createdAt: firestoreAdmin.FieldValue.serverTimestamp()
    });
    
    return { 
      success: true, 
      playlistId: newPlaylistRef.id 
    };
  } catch (error) {
    console.error('Error creating playlist:', error);
    return { success: false, error: 'DATABASE_ERROR' };
  }
};

/**
 * Update Playlist
 */
const updatePlaylist = async (playlistId, data) => {
  try {
    await playlistsCollection.doc(playlistId).update({
      ...data,
      updatedAt: firestoreAdmin.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(`Error updating playlist ${playlistId}:`, error);
    return false;
  }
};

/**
 * Delete Playlist
 */
const deletePlaylist = async (playlistId) => {
  try {
    await playlistsCollection.doc(playlistId).delete();
    return true;
  } catch (error) {
    console.error(`Error deleting playlist ${playlistId}:`, error);
    return false;
  }
};

/**
 * Get User Data
 */
const getUser = async (userId) => {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    return docToObj(userDoc);
  } catch (error) {
    console.error(`Error getting user ${userId}:`, error);
    return null;
  }
};

/**
 * Create or Update User
 */
const saveUser = async (userId, data) => {
  try {
    await usersCollection.doc(userId).set(data, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving user ${userId}:`, error);
    return false;
  }
};

module.exports = {
  // Document converters
  docToObj,
  queryToArray,
  
  // Server operations
  getServer,
  saveServer,
  
  // Playlist operations
  getPlaylist,
  getUserPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  
  // User operations
  getUser,
  saveUser,
  
  // Collection references
  serversCollection,
  playlistsCollection,
  usersCollection
}; 