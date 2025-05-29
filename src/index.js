/**
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

// Cache bot configuration
client.config = config;
client.language = config.language || "en"; // Default language

// Import player setup
require('./config/player')(client);

// Load commands
client.commands = [];
const commandsPath = path.join(__dirname, 'commands');
logger.info(LOG_CATEGORY, 'Loading commands from: ' + commandsPath);

function loadCommands(dir) {
  const commandFiles = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of commandFiles) {
    const filePath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.name.endsWith('.js')) {
      try {
        const command = require(filePath);
        
        // Add command to collection
        if (command.name) {
          client.commands.push(command);
          logger.debug(LOG_CATEGORY, `Loaded command: ${command.name}`);
        }
      } catch (error) {
        logger.error(LOG_CATEGORY, `Failed to load command from ${filePath}: ${error.message}`);
      }
    }
  }
}

// Recursively load all commands
loadCommands(commandsPath);
logger.info(LOG_CATEGORY, `Loaded ${client.commands.length} commands`);

// Register events - Discord Events
logger.info(LOG_CATEGORY, 'Registering Discord events');
const discordEventsPath = path.join(__dirname, 'events/discord');
if (fs.existsSync(discordEventsPath)) {
  const eventFiles = fs.readdirSync(discordEventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(path.join(discordEventsPath, file));
    const eventName = file.split('.')[0];
    logger.debug(LOG_CATEGORY, `Registering Discord event: ${eventName}`);
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
    logger.debug(LOG_CATEGORY, `Registering Player event: ${eventName}`);
    client.player.on(eventName, event.bind(null, client));
  }
}

// Login to Discord
logger.info(LOG_CATEGORY, 'Logging in to Discord');
client.login(config.TOKEN || process.env.DISCORD_TOKEN)
  .then(() => logger.info(LOG_CATEGORY, `Bot successfully logged in as ${client.user.tag}`))
  .catch(err => logger.critical(LOG_CATEGORY, `Failed to login: ${err}`));
