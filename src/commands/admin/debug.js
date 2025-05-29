const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const { loadLanguage } = require("../../utils/languageLoader");
const logger = require("../../utils/logger");
const { Routes } = require("discord-api-types/v10");
const { REST } = require("@discordjs/rest");
const config = require("../../config/bot");

const LOG_CATEGORY = 'Debug';

module.exports = {
  name: "debug",
  description: "Debug commands and bot status. Admin only.",
  permissions: "0x0000000000000008", // ADMINISTRATOR
  options: [
    {
      name: "action",
      description: "Debug action to perform",
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: "Refresh Guild Commands", value: "refresh_guild" },
        { name: "List Registered Commands", value: "list_commands" },
        { name: "Show Bot Info", value: "bot_info" }
      ]
    }
  ],
  run: async (client, interaction) => {
    // Hanya owner atau admin yang bisa menggunakan command ini
    if (!config.ownerID.includes(interaction.user.id) && !interaction.member.permissions.has("ADMINISTRATOR")) {
      return interaction.reply({ 
        content: "Anda tidak memiliki izin untuk menggunakan command ini!", 
        ephemeral: true 
      });
    }
    
    // Muat bahasa
    const lang = loadLanguage(client.language);
    
    // Dapatkan action
    const action = interaction.options.getString("action");
    
    // Defer reply karena beberapa aksi mungkin memakan waktu
    await interaction.deferReply({ ephemeral: true });
    
    try {
      switch (action) {
        case "refresh_guild":
          await refreshGuildCommands(client, interaction);
          break;
        case "list_commands":
          await listCommands(client, interaction);
          break;
        case "bot_info":
          await showBotInfo(client, interaction);
          break;
        default:
          await interaction.editReply({ content: "Aksi tidak valid!" });
      }
    } catch (error) {
      logger.error(LOG_CATEGORY, `Error in debug command: ${error.message}`);
      logger.error(LOG_CATEGORY, error.stack);
      
      await interaction.editReply({ 
        content: `Terjadi error saat menjalankan debug command: ${error.message}` 
      });
    }
  }
};

// Fungsi untuk merefresh guild commands
async function refreshGuildCommands(client, interaction) {
  try {
    const rest = new REST({ version: "10" }).setToken(config.TOKEN || process.env.TOKEN);
    
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
    
    // Register ke guild ini
    const guildId = interaction.guild.id;
    const result = await rest.put(
      Routes.applicationGuildCommands(client.user.id, guildId),
      { body: commandsToRegister }
    );
    
    await interaction.editReply({
      content: `✅ Berhasil mendaftarkan ${result.length} commands ke guild ini!\nCommand seharusnya segera tersedia. Jika belum muncul, coba restart Discord client Anda.`
    });
    
    logger.info(LOG_CATEGORY, `Refreshed ${result.length} commands to guild ${guildId}`);
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk menampilkan daftar commands
async function listCommands(client, interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("📋 Registered Commands")
      .setColor("#0099ff")
      .setDescription(`Bot memiliki ${client.commands.length} commands yang terdaftar.`)
      .addFields(
        client.commands.map(cmd => ({
          name: `/${cmd.name}`, 
          value: cmd.description || 'No description',
          inline: true
        }))
      )
      .setTimestamp()
      .setFooter({ text: `Requested by ${interaction.user.tag}` });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    throw error;
  }
}

// Fungsi untuk menampilkan info bot
async function showBotInfo(client, interaction) {
  try {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Info")
      .setColor("#0099ff")
      .addFields([
        { name: "Bot User", value: `${client.user.tag} (${client.user.id})`, inline: true },
        { name: "Uptime", value: formatUptime(client.uptime), inline: true },
        { name: "Commands", value: `${client.commands.length} commands`, inline: true },
        { name: "Servers", value: `${client.guilds.cache.size} servers`, inline: true },
        { name: "Node.js", value: process.version, inline: true },
        { name: "Discord.js", value: require("discord.js").version, inline: true }
      ])
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    throw error;
  }
}

// Helper untuk format uptime
function formatUptime(uptime) {
  const seconds = Math.floor(uptime / 1000) % 60;
  const minutes = Math.floor(uptime / (1000 * 60)) % 60;
  const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
  const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
  
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
} 