/**
 * Player configuration
 */
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { DeezerPlugin } = require("@distube/deezer");
const { YouTubePlugin } = require("@distube/youtube");
const YouTubeMusicPlugin = require("ytmusic-distube-plugin");
const logger = require('../utils/logger');

const LOG_CATEGORY = 'PlayerConfig';

// Ensure FFmpeg path is set
const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

/**
 * Configure and initialize the music player
 * @param {Client} client - Discord.js client
 */
module.exports = (client) => {
  logger.info(LOG_CATEGORY, 'Initializing DisTube player');
  
  try {
    // Create DisTube instance
    client.player = new DisTube(client, {
      plugins: [
        new YouTubeMusicPlugin(),
        new SpotifyPlugin({
          api: {
            clientId: client.config.spotify?.clientId,
            clientSecret: client.config.spotify?.clientSecret
          }
        }),
        new SoundCloudPlugin(),
        new YouTubePlugin()
      ],
      nsfw: false,
      joinNewVoiceChannel: false
    });
    
    logger.info(LOG_CATEGORY, 'DisTube player initialized successfully');
    
    // Log system information for debugging
    logger.debug(LOG_CATEGORY, `Node.js version: ${process.version}`);
    logger.debug(LOG_CATEGORY, `Platform: ${process.platform} ${process.arch}`);
    logger.debug(LOG_CATEGORY, `FFmpeg path: ${ffmpegPath}`);
    logger.debug(LOG_CATEGORY, `Discord.js version: ${require("discord.js").version}`);
    logger.debug(LOG_CATEGORY, `DisTube version: ${require("distube").version}`);
  } catch (error) {
    logger.critical(LOG_CATEGORY, `Failed to initialize DisTube player: ${error}`);
    throw error;
  }
};
