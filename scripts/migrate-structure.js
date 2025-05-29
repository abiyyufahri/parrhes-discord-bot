const fs = require('fs');
const path = require('path');

// Root path
const rootPath = path.resolve(__dirname, '..');

// Helper function untuk membuat folder jika belum ada
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Array struktur folder
const directories = [
  // src folder dan subdirectories
  'src',
  'src/commands/music',
  'src/commands/playlist',
  'src/commands/utility',
  'src/commands/admin',
  'src/events/discord',
  'src/events/player',
  'src/services/music',
  'src/services/playlist',
  'src/services/core',
  'src/repositories/firestore',
  'src/repositories/mongodb',
  'src/models',
  'src/utils',
  'src/middleware',
  'src/config',
  
  // Root level directories
  'assets',
  'scripts'
];

// Buat direktori yang diperlukan
directories.forEach(dir => {
  ensureDir(path.join(rootPath, dir));
});

// Fungsi untuk memindahkan file
function moveFile(source, destination) {
  try {
    if (fs.existsSync(source)) {
      console.log(`Moving ${source} to ${destination}`);
      // Baca file dan tulis di lokasi baru
      const content = fs.readFileSync(source);
      fs.writeFileSync(destination, content);
    } else {
      console.log(`Source file not found: ${source}`);
    }
  } catch (error) {
    console.error(`Error moving ${source}: ${error.message}`);
  }
}

// File yang akan dipindahkan
const filesToMove = [
  // Repository files
  { from: 'repository/firestore/playlistRepository.js', to: 'src/repositories/firestore/playlistRepository.js' },
  { from: 'repository/firestore/musicbotRepository.js', to: 'src/repositories/firestore/musicbotRepository.js' },
  { from: 'repository/firestore/index.js', to: 'src/repositories/firestore/index.js' },
  
  // Service files
  { from: 'services/playlistService.js', to: 'src/services/playlist/playlistService.js' },
  { from: 'services/musicbotService.js', to: 'src/services/music/musicbotService.js' },
  { from: 'services/index.js', to: 'src/services/index.js' },
  
  // Configuration files
  { from: 'config.js', to: 'src/config/bot.js' },
];

// Pindahkan file ke lokasi baru
filesToMove.forEach(file => {
  moveFile(
    path.join(rootPath, file.from),
    path.join(rootPath, file.to)
  );
});

// Divide commands into categories
console.log('Creating command categories...');

// Music commands
const musicCommands = ['play.js', 'pause.js', 'resume.js', 'skip.js', 'stop.js', 'volume.js', 'nowplaying.js', 'queue.js', 'loop.js', 'shuffle.js', 'seek.js', 'back.js', 'filter.js', 'time.js', 'autoplay.js'];

// Playlist commands
const playlistCommands = ['playlist.js', 'save.js'];

// Utility commands
const utilityCommands = ['ping.js', 'help.js', 'language.js', 'about.js'];

// Admin commands
const adminCommands = ['bot-statistic.js', 'dj.js', 'channel.js', 'clear.js', 'servers.js'];

// Function to categorize and move commands
function categorizeCommands() {
  const commandsDir = path.join(rootPath, 'commands');
  if (!fs.existsSync(commandsDir)) {
    console.log('Commands directory not found');
    return;
  }

  const files = fs.readdirSync(commandsDir);
  
  files.forEach(file => {
    if (!file.endsWith('.js')) return;
    
    let targetCategory = 'utility'; // Default category
    
    if (musicCommands.includes(file)) {
      targetCategory = 'music';
    } else if (playlistCommands.includes(file)) {
      targetCategory = 'playlist';
    } else if (adminCommands.includes(file)) {
      targetCategory = 'admin';
    }
    
    const sourcePath = path.join(commandsDir, file);
    const targetPath = path.join(rootPath, 'src/commands', targetCategory, file);
    
    moveFile(sourcePath, targetPath);
  });
}

// Categorize and move command files
categorizeCommands();

// Move events
function categorizeEvents() {
  const eventsDir = path.join(rootPath, 'events');
  if (!fs.existsSync(eventsDir)) {
    console.log('Events directory not found');
    return;
  }

  const files = fs.readdirSync(eventsDir);
  
  files.forEach(file => {
    if (!file.endsWith('.js') || file === 'player') return;
    
    const sourcePath = path.join(eventsDir, file);
    const targetPath = path.join(rootPath, 'src/events/discord', file);
    
    moveFile(sourcePath, targetPath);
  });
  
  // Handle player events separately
  const playerEventsDir = path.join(eventsDir, 'player');
  if (fs.existsSync(playerEventsDir)) {
    const playerFiles = fs.readdirSync(playerEventsDir);
    
    playerFiles.forEach(file => {
      if (!file.endsWith('.js')) return;
      
      const sourcePath = path.join(playerEventsDir, file);
      const targetPath = path.join(rootPath, 'src/events/player', file);
      
      moveFile(sourcePath, targetPath);
    });
  }
}

// Categorize and move event files
categorizeEvents();

// Create utils directory contents
function setupUtils() {
  console.log('Setting up utils directory...');
  
  // Create format.js utility
  const formatUtilPath = path.join(rootPath, 'src/utils/format.js');
  const formatUtilContent = `/**
 * Utility functions for formatting
 */

/**
 * Format duration in seconds to hh:mm:ss format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  } else {
    return \`\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
  }
}

/**
 * Get icon for music source
 * @param {string} source - Music source name
 * @returns {string} Emoji representing the source
 */
function getSourceIcon(source) {
  switch(source && source.toLowerCase()) {
    case 'spotify':
      return '🟢';
    case 'youtube':
    case 'youtube-music':
      return '🔴';
    case 'soundcloud':
      return '🟠';
    case 'custom':
      return '🎵';
    default:
      return '🎧';
  }
}

module.exports = {
  formatDuration,
  getSourceIcon
};`;

  fs.writeFileSync(formatUtilPath, formatUtilContent);
  
  // Create logger.js utility
  const loggerUtilPath = path.join(rootPath, 'src/utils/logger.js');
  const loggerUtilContent = `/**
 * Logger utility
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Current log level (can be changed at runtime)
let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level
 * @param {number} level - Log level to set
 */
function setLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Format the log message with timestamp and category
 * @param {string} level - Log level name
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
function formatLog(level, category, message) {
  const timestamp = new Date().toISOString();
  return \`[\${timestamp}] [\${level}] [\${category}] \${message}\`;
}

/**
 * Log a debug message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function debug(category, message) {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(formatLog('DEBUG', category, message));
  }
}

/**
 * Log an info message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function info(category, message) {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(formatLog('INFO', category, message));
  }
}

/**
 * Log a warning message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function warn(category, message) {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(formatLog('WARN', category, message));
  }
}

/**
 * Log an error message
 * @param {string} category - Log category
 * @param {string|Error} error - Error message or object
 */
function error(category, error) {
  if (currentLogLevel <= LogLevel.ERROR) {
    const message = error instanceof Error ? \`\${error.message}\\n\${error.stack}\` : error;
    console.error(formatLog('ERROR', category, message));
  }
}

/**
 * Log a critical message
 * @param {string} category - Log category
 * @param {string|Error} error - Error message or object
 */
function critical(category, error) {
  if (currentLogLevel <= LogLevel.CRITICAL) {
    const message = error instanceof Error ? \`\${error.message}\\n\${error.stack}\` : error;
    console.error(formatLog('CRITICAL', category, message));
  }
}

module.exports = {
  LogLevel,
  setLogLevel,
  debug,
  info,
  warn,
  error,
  critical
};`;

  fs.writeFileSync(loggerUtilPath, loggerUtilContent);
}

// Setup utils
setupUtils();

// Create main index.js file to structure imports
function createMainIndex() {
  console.log('Creating main index.js file...');
  
  const mainIndexPath = path.join(rootPath, 'src/index.js');
  const mainIndexContent = `/**
 * Main entry point for the Parrhes Discord Bot
 */
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require('./config/bot');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

// Configure logger
const LOG_CATEGORY = 'Main';

// Initialize Discord client
logger.info(LOG_CATEGORY, 'Initializing Discord client');
const client = new Client({
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.User,
  ],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Import player setup
require('./config/player')(client);

// Cache bot configuration
client.config = config;

// Register events - Discord Events
logger.info(LOG_CATEGORY, 'Registering Discord events');
const discordEventsPath = path.join(__dirname, 'events/discord');
if (fs.existsSync(discordEventsPath)) {
  const eventFiles = fs.readdirSync(discordEventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(discordEventsPath, file));
    const eventName = file.split('.')[0];
    logger.debug(LOG_CATEGORY, \`Registering Discord event: \${eventName}\`);
    client.on(eventName, event.bind(null, client));
  }
}

// Register events - Player Events
logger.info(LOG_CATEGORY, 'Registering Player events');
const playerEventsPath = path.join(__dirname, 'events/player');
if (fs.existsSync(playerEventsPath)) {
  const eventFiles = fs.readdirSync(playerEventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(playerEventsPath, file));
    const eventName = file.split('.')[0];
    logger.debug(LOG_CATEGORY, \`Registering Player event: \${eventName}\`);
    client.player.on(eventName, event.bind(null, client));
  }
}

// Login to Discord
logger.info(LOG_CATEGORY, 'Logging in to Discord');
client.login(config.TOKEN || process.env.DISCORD_TOKEN)
  .then(() => logger.info(LOG_CATEGORY, \`Bot successfully logged in as \${client.user.tag}\`))
  .catch(err => logger.critical(LOG_CATEGORY, \`Failed to login: \${err}\`));
`;

  fs.writeFileSync(mainIndexPath, mainIndexContent);
}

// Create main index.js
createMainIndex();

// Create player config file
function createPlayerConfig() {
  console.log('Creating player config file...');
  
  const playerConfigPath = path.join(rootPath, 'src/config/player.js');
  const playerConfigContent = `/**
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
    logger.debug(LOG_CATEGORY, \`Node.js version: \${process.version}\`);
    logger.debug(LOG_CATEGORY, \`Platform: \${process.platform} \${process.arch}\`);
    logger.debug(LOG_CATEGORY, \`FFmpeg path: \${ffmpegPath}\`);
    logger.debug(LOG_CATEGORY, \`Discord.js version: \${require("discord.js").version}\`);
    logger.debug(LOG_CATEGORY, \`DisTube version: \${require("distube").version}\`);
  } catch (error) {
    logger.critical(LOG_CATEGORY, \`Failed to initialize DisTube player: \${error}\`);
    throw error;
  }
};
`;

  fs.writeFileSync(playerConfigPath, playerConfigContent);
}

// Create player config
createPlayerConfig();

// Update root index.js to use new structure
function updateRootIndex() {
  console.log('Updating root index.js...');
  
  const rootIndexPath = path.join(rootPath, 'index.js');
  const rootIndexContent = `/**
 * Entry point for Parrhes Discord Bot
 */
const config = require('./src/config/bot');
const keep_alive = require('./keep_alive.js');
const logger = require('./src/utils/logger');

const LOG_CATEGORY = 'Bootstrap';

// Enable sharding if configured
if (config.shardManager?.shardStatus === true) {
  logger.info(LOG_CATEGORY, 'Starting bot with sharding enabled');
  
  const { ShardingManager } = require('discord.js');
  const manager = new ShardingManager('./src/index.js', { 
    token: config.TOKEN || process.env.DISCORD_TOKEN 
  });
  
  manager.on('shardCreate', shard => {
    logger.info(LOG_CATEGORY, \`Launched shard \${shard.id}\`);
  });
  
  manager.spawn();
} else {
  logger.info(LOG_CATEGORY, 'Starting bot in single-instance mode');
  require('./src/index.js');
}
`;

  fs.writeFileSync(rootIndexPath, rootIndexContent);
}

// Update root index.js
updateRootIndex();

console.log('Migration script completed! New structure has been created.');
console.log('Please review the changes and modify files as needed.');
console.log('Note: Original files have not been deleted for safety. Please delete them manually after verifying.'); 