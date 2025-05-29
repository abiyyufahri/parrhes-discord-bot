/**
 * Entry point for Parrhes Discord Bot
 */
const config = require('./src/config/bot');
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
    logger.info(LOG_CATEGORY, `Launched shard ${shard.id}`);
  });
  
  manager.spawn();
} else {
  logger.info(LOG_CATEGORY, 'Starting bot in single-instance mode');
  require('./src/index.js');
}
