const config = require("../../config/bot");
const { ActivityType } = require("discord.js");
const path = require("path");
const logger = require("../../utils/logger");
const { loadLanguage } = require("../../utils/languageLoader");

const LOG_CATEGORY = 'Ready';

module.exports = async (client) => {
  const langCode = client.language || "en";
  const lang = loadLanguage(langCode);

  if (config.firebaseEnabled || config.mongodbURL || process.env.MONGO) {
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v10");
    const rest = new REST({ version: "10" }).setToken(
      config.TOKEN || process.env.TOKEN
    );
    
    // Periksa apakah commands sudah dimuat
    if (!client.commands || client.commands.length === 0) {
      logger.error(LOG_CATEGORY, "No commands loaded! Cannot register slash commands.");
      console.log(lang.error3 + "No commands loaded!");
      return;
    }
    
    logger.info(LOG_CATEGORY, `Registering ${client.commands.length} slash commands`);
    client.commands.forEach((cmd, index) => {
      logger.debug(LOG_CATEGORY, `Command ${index+1}: ${cmd.name} - ${cmd.description?.substring(0, 30) || 'No description'}...`);
      
      // Validasi command
      if (!cmd.name) {
        logger.warn(LOG_CATEGORY, `Command at index ${index} has no name property!`);
      }
      if (!cmd.description) {
        logger.warn(LOG_CATEGORY, `Command "${cmd.name}" has no description property!`);
      }
    });
    
    (async () => {
      try {
        // Register commands to Discord API
        const commandsToRegister = client.commands.map(command => {
          // Konversi hex string permission ke integer jika ada
          let permissionValue = null;
          if (command.permissions) {
            // Parse hex string menjadi integer
            try {
              // Konversi hex ke integer
              if (typeof command.permissions === 'string' && command.permissions.startsWith('0x')) {
                permissionValue = BigInt(command.permissions).toString();
              } else {
                permissionValue = command.permissions.toString();
              }
            } catch (e) {
              logger.warn(LOG_CATEGORY, `Invalid permission format for command ${command.name}: ${command.permissions}`);
            }
          }
          
          const formattedCommand = {
            name: command.name,
            description: command.description || 'No description provided',
            options: command.options || [],
            // Gunakan nilai permission yang sudah dikonversi
            default_member_permissions: permissionValue
          };
          return formattedCommand;
        });

        // Registrasi global
        const result = await rest.put(
          Routes.applicationCommands(client.user.id), 
          { body: commandsToRegister }
        );
        
        logger.info(LOG_CATEGORY, `Successfully registered ${result.length} global slash commands`);
        console.log(lang.loadslash);

        // Jika ada guild ID untuk testing, register juga ke guild tersebut
        // Ini membuat command segera tersedia di guild tertentu
        const testGuildIds = config.testGuildIds || [];
        if (testGuildIds.length > 0) {
          for (const guildId of testGuildIds) {
            await registerGuildCommands(guildId);
          }
        }
      } catch (err) {
        logger.error(LOG_CATEGORY, `Failed to register slash commands: ${err.message}`);
        console.log(lang.error3 + err);
        
        // Log error stack untuk debugging
        console.error(err);
      }
    })();

    console.log(client.user.username + lang.ready);

    setInterval(
      () =>
        client.user.setActivity({
          name: `${config.status} - this shard ${
            Number(client?.shard?.ids) + 1
              ? Number(client?.shard?.ids) + 1
              : "1"
          }`,
          type: ActivityType.Listening,
        }),
      10000
    );
    client.errorLog = config.errorLog;
  } else {
    console.log(lang.error4);
  }

  if (
    client.config.voteManager.status === true &&
    client.config.voteManager.api_key
  ) {
    const { AutoPoster } = require("topgg-autoposter");
    const ap = AutoPoster(client.config.voteManager.api_key, client);
    ap.on("posted", () => {});
  }
};

// Tambahkan fungsi untuk mendaftarkan ke guild spesifik
async function registerGuildCommands(guildId) {
  try {
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v10");
    const rest = new REST({ version: "10" }).setToken(
      config.TOKEN || process.env.TOKEN
    );
    
    // Format commands untuk API Discord
    const commandsToRegister = client.commands.map(command => {
      // Konversi hex string permission ke integer jika ada
      let permissionValue = null;
      if (command.permissions) {
        // Parse hex string menjadi integer
        try {
          // Konversi hex ke integer
          if (typeof command.permissions === 'string' && command.permissions.startsWith('0x')) {
            permissionValue = BigInt(command.permissions).toString();
          } else {
            permissionValue = command.permissions.toString();
          }
        } catch (e) {
          logger.warn(LOG_CATEGORY, `Invalid permission format for command ${command.name}: ${command.permissions}`);
        }
      }
      
      return {
        name: command.name,
        description: command.description || 'No description provided',
        options: command.options || [],
        default_member_permissions: permissionValue
      };
    });
    
    logger.info(LOG_CATEGORY, `Registering commands to guild ${guildId}`);
    const guildResult = await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commandsToRegister }
    );
    logger.info(LOG_CATEGORY, `Registered ${guildResult.length} commands to guild ${guildId}`);
    return true;
  } catch (err) {
    logger.error(LOG_CATEGORY, `Failed to register guild commands: ${err}`);
    return false;
  }
}
