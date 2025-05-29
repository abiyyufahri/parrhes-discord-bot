// src/events/discord/guildCreate.js
const logger = require('../../utils/logger');
const { dbService } = require('../../services/core');

/**
 * Fungsi delay dengan Promise
 * @param {number} ms - Milliseconds untuk delay
 * @returns {Promise} - Promise yang resolve setelah waktu tertentu
 */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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
        return true;
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
    
    // Memperbarui pesan log untuk mencerminkan interval 10 detik
    // Periksa apakah guild sudah terdaftar di Firestore dengan 3x retry
    logger.info(LOG_CATEGORY, `Memulai pemeriksaan ketersediaan guild ${guild.id} dengan 3x retry (interval 10 detik)`);
    const existingGuild = await checkGuildWithRetry(client, guild.id, 3, 8000);
    
    if (!existingGuild) {
      logger.warn(LOG_CATEGORY, `Guild ${guild.id} tidak terdaftar di database setelah 3x percobaan. Bot akan langsung meninggalkan server.`);
      
      // Kirim pesan ke default channel
      const defaultChannel = guild.channels.cache.find(
        channel => channel.type === 0 && channel.permissionsFor(guild.members.me).has('SendMessages')
      );
      
      if (defaultChannel) {
        await defaultChannel.send({
          content: `⚠️ **Server ini tidak terdaftar!**\n\n` +
                  `Untuk menggunakan bot ini, admin server harus mendaftar melalui web dashboard kami:\n` +
                  `🔗 https://biyxto.abiyyufahri.my.id\n\n` +
                  `Bot akan meninggalkan server karena server tidak terdaftar.`
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
      
      // Langsung meninggalkan guild tanpa timeout
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
      logger.info(LOG_CATEGORY, `Guild ${guild.id} sudah terdaftar di database. Bot tetap bergabung.`);
      
      // Kirim pesan sambutan untuk guild yang terdaftar
      const defaultChannel = guild.channels.cache.find(
        channel => channel.type === 0 && channel.permissionsFor(guild.members.me).has('SendMessages')
      );
      
      if (defaultChannel) {
        await defaultChannel.send({
          content: `👋 **Terima kasih telah menggunakan bot kami!**\n\n` +
                  `Server ini telah terdaftar. Gunakan \`/help\` untuk melihat daftar perintah yang tersedia.\n\n` +
                  `Akses dashboard bot untuk konfigurasi lebih lanjut:\n` +
                  `🔗 https://biyxto.abiyyufahri.my.id/dashboard`
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