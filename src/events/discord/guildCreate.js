// src/events/discord/guildCreate.js
const logger = require('../../utils/logger');
const { dbService } = require('../../services/core');
const { EmbedBuilder } = require('discord.js');
const en = require('../../../languages/en');
const id = require('../../../languages/id');

/**
 * Mendapatkan string terjemahan berdasarkan bahasa guild
 * @param {string} server_lang - Kode bahasa server (id, en)
 * @param {string} key - Kunci terjemahan
 * @returns {string} - String terjemahan
 */
function getLang(server_lang = 'en', key) {
  // Tambahkan bahasa lain jika diperlukan
  let lang;
  switch(server_lang) {
    case 'id':
      lang = id;
      break;
    default:
      lang = en;
      break;
  }
  
  return lang[key] || en[key] || key;
}

/**
 * Fungsi delay dengan Promise
 * @param {number} ms - Milliseconds untuk delay
 * @returns {Promise} - Promise yang resolve setelah waktu tertentu
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fungsi untuk membuat embed checking status
 * @param {string} lang - Kode bahasa
 * @returns {EmbedBuilder} Discord embed untuk checking status
 */
function getCheckingEmbed(lang = 'en') {
  return new EmbedBuilder()
    .setColor('#FFCC00')
    .setTitle('<a:loader:1166440593895981106>    ' + getLang(lang, 'checking_server'))
    .setDescription(getLang(lang, 'checking_server_desc'))
    .setFooter({ text: getLang(lang, 'checking_footer') })
    .setTimestamp();
}

/**
 * Fungsi untuk membuat embed server tidak terdaftar
 * @param {string} lang - Kode bahasa
 * @returns {EmbedBuilder} Discord embed untuk server tidak terdaftar
 */
function getUnregisteredEmbed(lang = 'en') {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('⚠️ ' + getLang(lang, 'unregistered_server'))
    .setDescription(getLang(lang, 'unregistered_server_desc'))
    .addFields(
      { name: getLang(lang, 'dashboard_url'), value: '🔗 https://biyxto.abiyyufahri.my.id', inline: false },
      { name: getLang(lang, 'status'), value: getLang(lang, 'bot_leave_status'), inline: false }
    )
    .setFooter({ text: getLang(lang, 'register_tip') })
    .setTimestamp();
}

/**
 * Fungsi untuk membuat embed server terdaftar
 * @param {string} lang - Kode bahasa
 * @returns {EmbedBuilder} Discord embed untuk server terdaftar
 */
function getRegisteredEmbed(lang = 'en') {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('👋 ' + getLang(lang, 'welcome_title'))
    .setDescription(getLang(lang, 'registered_server_desc'))
    .addFields(
      { name: getLang(lang, 'dashboard_url'), value: '🔗 https://biyxto.abiyyufahri.my.id/dashboard', inline: false },
      { name: getLang(lang, 'status'), value: getLang(lang, 'server_registered_status'), inline: false }
    )
    .setFooter({ text: getLang(lang, 'enjoy_bot') })
    .setTimestamp();
}

/**
 * Fungsi untuk memeriksa ketersediaan guild dengan retry logic
 * @param {Client} client - Discord Client
 * @param {string} guildId - ID guild yang akan diperiksa
 * @param {number} maxRetries - Jumlah maksimal percobaan
 * @param {number} delayMs - Jeda waktu antara percobaan (ms)
 * @returns {Promise<boolean>} - true jika guild tersedia, false jika tidak
 */
async function checkGuildWithRetry(client, guildId, maxRetries = 3, delayMs = 3000) {
  const LOG_CATEGORY = 'CheckGuildRetry';
  let retries = 0;
  
  while (retries < maxRetries) {
    const currentAttempt = retries + 1;
    // Catat waktu mulai setiap percobaan
    const startTime = Date.now();
    logger.info(LOG_CATEGORY, `Percobaan ke-${currentAttempt} dari ${maxRetries} untuk cek guild ${guildId} pada ${new Date().toISOString()} (interval: ${delayMs/1000}s)`);
    
    // Cek apakah guild terdaftar di database server
    try {
      const existingGuild = await dbService.server.findOne({ guildID: guildId });
      
      if (existingGuild) {
        logger.info(LOG_CATEGORY, `Guild ${guildId} terdeteksi terdaftar pada percobaan ke-${currentAttempt}`);
        return existingGuild;
      }
      
      logger.info(LOG_CATEGORY, `Guild ${guildId} belum terdaftar pada percobaan ke-${currentAttempt}`);
    } catch (error) {
      logger.error(LOG_CATEGORY, `Error saat memeriksa guild ${guildId} pada percobaan ke-${currentAttempt}: ${error}`);
    }
    
    retries++;
    
    // Hanya delay dan retry jika belum mencapai percobaan terakhir
    if (retries < maxRetries) {
      // Hitung waktu yang tepat untuk menunggu (kompensasi waktu yang sudah digunakan)
      const elapsedTime = Date.now() - startTime;
      const remainingDelay = Math.max(1, delayMs - elapsedTime); // Minimal 1ms jika sudah melebihi waktu
      
      logger.info(LOG_CATEGORY, `Menunggu ${remainingDelay}ms sebelum percobaan ke-${retries + 1} (waktu berlalu: ${elapsedTime}ms)`);
      await delay(remainingDelay);
    }
  }
  
  logger.warn(LOG_CATEGORY, `Guild ${guildId} tetap tidak terdeteksi setelah ${maxRetries} percobaan`);
  return false;
}

module.exports = async (client, guild) => {
  const LOG_CATEGORY = 'GuildCreate';
  
  try {
    logger.info(LOG_CATEGORY, `Bot ditambahkan ke guild baru: ${guild.name} (${guild.id})`);
    
    // Cari channel default yang bisa dikirimi pesan
    const defaultChannel = guild.channels.cache.find(
      channel => channel.type === 0 && channel.permissionsFor(guild.members.me).has('SendMessages')
    );
    
    // Dapatkan data guild untuk bahasa jika ada
    let server_lang = 'en';
    let guildData = null;
    
    try {
      // Coba cek pengaturan bahasa dari database terlebih dahulu
      guildData = await dbService.server.findOne({ guildID: guild.id });
      if (guildData && guildData.language) {
        server_lang = guildData.language;
      }
    } catch (error) {
      logger.error(LOG_CATEGORY, `Error saat mengambil pengaturan bahasa: ${error}`);
    }
    
    // Kirim pesan awal dengan status checking
    let statusMessage = null;
    if (defaultChannel) {
      statusMessage = await defaultChannel.send({
        embeds: [getCheckingEmbed(server_lang)]
      });
    }
    
    // Memulai pemeriksaan ketersediaan guild
    logger.info(LOG_CATEGORY, `Memulai pemeriksaan ketersediaan guild ${guild.id} dengan 3x retry (interval 8 detik)`);
    const existingGuild = await checkGuildWithRetry(client, guild.id, 3, 8000);
    
    if (!existingGuild) {
      logger.warn(LOG_CATEGORY, `Guild ${guild.id} tidak terdaftar di database setelah 3x percobaan. Bot akan langsung meninggalkan server.`);
      await dbService.server.deleteOne({ guildID: guild.id });

      // Edit pesan dengan embed server tidak terdaftar
      if (statusMessage) {
        await statusMessage.edit({
          embeds: [getUnregisteredEmbed(server_lang)]
        });
      }
      
      // Notifikasi ke channel log admin jika ada
      if (client.config.errorLog) {
        const logChannel = client.channels.cache.get(client.config.errorLog);
        if (logChannel) {
          await logChannel.send({
            content: `🚫 **Bot Ditambahkan ke Guild Tidak Terdaftar**\n` +
                    `**Guild:** ${guild.name} (${guild.id})\n` +
                    `**Owner:** <@${guild.ownerId}>\n` +
                    `**Members:** ${guild.memberCount}\n` +
                    `**Status:** Unregistered - Leaving immediately\n` +
                    `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
          });
        }
      }
      
      // Tunggu 1 detik sebelum meninggalkan guild agar pesan dapat dibaca
      await delay(1000);
      
      // Meninggalkan guild
      try {
        await guild.leave();
        logger.info(LOG_CATEGORY, `Bot berhasil meninggalkan guild ${guild.id} karena tidak terdaftar`);
        
        // Notifikasi ke log channel bahwa bot telah meninggalkan guild
        if (client.config.errorLog) {
          const logChannel = client.channels.cache.get(client.config.errorLog);
          if (logChannel) {
            await logChannel.send({
              content: `🚪 **Bot Meninggalkan Guild Tidak Terdaftar**\n` +
                      `**Guild:** ${guild.name} (${guild.id})\n` +
                      `**Reason:** Unregistered server\n` +
                      `**Time:** <t:${Math.floor(Date.now() / 1000)}:F>`
            });
          }
        }
      } catch (error) {
        logger.error(LOG_CATEGORY, `Error saat mencoba meninggalkan guild ${guild.id}: ${error}`);
      }
    } else {
      // Update server_lang jika guild ditemukan
      if (existingGuild.language) {
        server_lang = existingGuild.language;
      }
      
      logger.info(LOG_CATEGORY, `Guild ${guild.id} sudah terdaftar di database. Bot tetap bergabung.`);
      
      // Edit pesan dengan embed server terdaftar
      if (statusMessage) {
        await statusMessage.edit({
          embeds: [getRegisteredEmbed(server_lang)]
        });
      }
    }
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error menangani guild baru: ${error}`);
    
    // Jika terjadi error, lebih aman untuk meninggalkan guild
    try {
      await guild.leave();
      logger.warn(LOG_CATEGORY, `Bot meninggalkan guild ${guild.id} karena terjadi error saat pemeriksaan`);
    } catch (leaveError) {
      logger.error(LOG_CATEGORY, `Gagal meninggalkan guild ${guild.id}: ${leaveError}`);
    }
  }
};