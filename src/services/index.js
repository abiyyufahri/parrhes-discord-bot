/**
 * Services index
 */

const { dbService } = require('./core');
const playlistService = require('./playlist/playlistService');
const musicService = require('./music/musicbotService');

module.exports = {
  dbService,
  playlistService,
  musicService
}; 