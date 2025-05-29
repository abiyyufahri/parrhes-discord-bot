// src/events/discord/guildCreate.js
const logger = require('../../utils/logger');
const { dbService } = require('../../services/core');

module.exports = async (client, guild) => {
  const LOG_CATEGORY = 'GuildCreate';
  
  try {
    logger.info(LOG_CATEGORY, `Bot ditambahkan ke guild baru: ${guild.name} (${guild.id})`);
    
    // Periksa apakah guild sudah terdaftar di Firestore
    const existingGuild = await dbService.server.findOne({ guildID: guild.id });
    
    if (!existingGuild) {
      logger.warn(LOG_CATEGORY, `Guild ${guild.id} tidak terdaftar di database. Bot akan langsung meninggalkan server.`);
      
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