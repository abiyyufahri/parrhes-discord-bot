const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require("discord.js");
const { dbService } = require("../../services/core");
const errorNotifer = require("../../utils/functions.js");
const config = require("../../config/bot");
const { loadLanguage } = require("../../utils/languageLoader");

module.exports = {
  name: "play",
  description: "Play a track.",
  permissions: "0x0000000000000800",
  options: [
    {
      name: "normal",
      description: "Open music from other platforms.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Write your music name.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "playlist",
      description: "Write your playlist name.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Write the name of the playlist you want to create.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
  ],
  voiceChannel: true,
  run: async (client, interaction) => {
    try {
      // Mendapatkan pengaturan bahasa
      let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });
      const langCode = dbLang?.language || client.language;
      const lang = loadLanguage(langCode);
      
      // PENTING: Gunakan deferReply di awal untuk mencegah timeout
      try {
        await interaction.deferReply();
      } catch (e) {
        // Mungkin interaksi sudah di-reply atau defer sebelumnya, bisa diabaikan
        console.error("Error deferring reply (can be ignored if already replied):", e);
      }
      
      // Verifikasi voice channel
      if (!interaction.member.voice.channel) {
        return interaction.editReply({ 
          content: "Kamu perlu berada di voice channel untuk memutar musik!",
          ephemeral: true
        }).catch(e => {});
      }
      
      const stp = interaction.options.getSubcommand();

      if (stp === "playlist") {
        // Handle custom playlist feature
        const playlistw = interaction.options.getString("name");
        let playlist;
        
        try {
          playlist = await dbService.playlist.find().catch((e) => { console.error("Error fetching playlists:", e); });
        } catch (e) {
          console.error("Error querying playlists:", e);
        }
        
        if (!playlist?.length) {
          return interaction.editReply({ content: lang.msg52, ephemeral: true }).catch(e => {});
        }

        let arr = 0;
        for (let i = 0; i < playlist.length; i++) {
          if (playlist[i]?.playlist?.filter((p) => p.name === playlistw)?.length > 0) {
            const playlist_owner_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].author;
            const playlist_public_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].public;

            if (playlist_owner_filter !== interaction.member.id) {
              if (playlist_public_filter === false) {
                return interaction.editReply({ content: lang.msg53, ephemeral: true }).catch(e => {});
              }
            }

            const music_filter = playlist[i]?.musics?.filter((m) => m.playlist_name === playlistw);
            if (!music_filter?.length)
              return interaction.editReply({ content: lang.msg54, ephemeral: true }).catch(e => {});

            await interaction.editReply({ content: lang.msg56 }).catch(e => {});

            const songs = [];
            music_filter.map((m) => songs.push(m.music_url));

            console.log(songs);

            try {
              // Membuat thumbnail dan totalDuration untuk playlist dari musik yang ada
              const thumbnail = music_filter.find(m => m.music_thumbnail)?.music_thumbnail || null;
              const totalDuration = music_filter.reduce((total, song) => {
                return total + (song.music_duration || 0);
              }, 0);
              
              // Membuat playlist kustom menggunakan DisTube
              const customPlaylist = await client.player.createCustomPlaylist(
                songs, 
                {
                  member: interaction.member,
                  metadata: {
                    interaction: interaction,
                    source: "custom",
                  },
                  name: playlistw,
                  source: "custom",
                  thumbnail: thumbnail
                }
              );
              
              // Memutar playlist custom yang telah dibuat
              await client.player.play(interaction.member.voice.channel, customPlaylist, {
                member: interaction.member,
                textChannel: interaction.channel,
                metadata: {
                  interaction: interaction
                }
              });

              await interaction
                .editReply({
                  content: lang.msg57
                    .replace("{interaction.member.id}", interaction.member.id)
                    .replace("{music_filter.length}", music_filter.length),
                })
                .catch(e => {});

              // Perlu try-catch sendiri untuk operasi update database
              try {
                // Update database hanya ketika playlist bisa diputar
                await Promise.all(playlist[i]?.playlist
                  ?.filter((p) => p.name === playlistw)
                  .map(async (p) => {
                    try {
                      await dbService.playlist
                        .updateOne(
                          { userID: p.author },
                          {
                            $pull: {
                              playlist: {
                                name: p.name
                              }
                            }
                          }
                        )
                        .catch(e => { console.error("Error updating playlist (pull):", e); });

                      await dbService.playlist
                        .updateOne(
                          { userID: p.author },
                          {
                            $push: {
                              playlist: {
                                name: p.name,
                                author: p.author,
                                authorTag: p.authorTag,
                                public: p.public,
                                plays: Number(p.plays) + 1,
                                createdTime: p.createdTime
                              }
                            }
                          }
                        )
                        .catch(e => { console.error("Error updating playlist (push):", e); });
                    } catch (e) {
                      console.error("Error incrementing playlist count:", e);
                    }
                  }));
              } catch (dbError) {
                console.error("Error updating playlist in database:", dbError);
                // Tidak perlu menghentikan pemutaran musik jika gagal update database
              }
            } catch (e) {
              console.error("Error playing playlist:", e);
              interaction.editReply({ 
                content: `${lang.msg60}\nError: ${e.message}`,
                ephemeral: true 
              }).catch(e => {
                console.error("Error updating reply after playlist error:", e);
              });
            }
          } else {
            arr++;
            if (arr === playlist.length) {
              return interaction.editReply({ content: lang.msg58, ephemeral: true }).catch(e => {});
            }
          }
        }
      }

      if (stp === "normal") {
        const name = interaction.options.getString("name");
        if (!name) return interaction.editReply({ content: lang.msg59, ephemeral: true }).catch(e => {});

        // Buat embed loading yang lebih menarik
        const loadingEmbed = new EmbedBuilder()
          .setColor("#474747")
          .setDescription(`${lang.msg61} \`${name}\``);
        
        // Kirim pesan loading dengan penanganan error yang lebih baik
        let loadingMessage;
        try {
          loadingMessage = await interaction.editReply({ 
            embeds: [loadingEmbed]
          });
          console.log(`[DEBUG][/play] Loading Embed: ${loadingMessage?.id || 'not found'}`);
        } catch (e) {
          console.error("Error sending loading message:", e);
          // Tetap lanjutkan meski gagal mengirim loading message
        }

        try {
          // DisTube dapat langsung menangani berbagai sumber termasuk Spotify 
          // dengan bantuan plugin yang sudah diatur di bot.js
          await client.player.play(interaction.member.voice.channel, name, {
            member: interaction.member,
            textChannel: interaction.channel,
            metadata: {
              interaction: interaction,
              loadingMessage: loadingMessage,
              isPlaylist: name.includes("playlist") || name.includes("album") || name.includes("list=") // Deteksi playlist
            }
          });
          
          // DisTube events di bot.js akan menangani rest of the communication
          
        } catch (e) {
          console.error("Error playing track:", e);
          
          const errorEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle(`❌ Error`)
            .setDescription(`${lang.msg60}: ${e.message}`)
            .setFooter({ text: "Silakan coba dengan URL atau kata kunci lain" });
          
          try {
            await interaction.editReply({ 
              embeds: [errorEmbed],
              content: null
            });
          } catch (replyError) {
            console.error("Error updating error message:", replyError);
          }
        }
      }
    } catch (e) {
      console.error("Top-level play command error:", e);
      
      // Fallback language for error handling
      const lang = require(`../../../languages/${config.language || "en"}.js`);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "Terjadi kesalahan saat menjalankan perintah. Silakan coba lagi nanti.",
            ephemeral: true
          }).catch(e => {});
        } else {
          await interaction.editReply({
            content: "Terjadi kesalahan saat memproses perintah. Silakan coba lagi nanti.",
            ephemeral: true
          }).catch(e => {});
        }
      } catch (replyError) {
        console.error("Error handling top-level error:", replyError);
      }
      
      errorNotifer(client, interaction, e, lang);
    }
  },
};

// Fungsi pembantu untuk format durasi
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}