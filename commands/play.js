const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js")
const db = require("../mongoDB")
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
      // PENTING: Gunakan deferReply di awal untuk mencegah timeout
      await interaction.deferReply().catch(e => {
        console.error("Error deferring reply (can be ignored if already replied):", e);
      });
      
      // Verifikasi voice channel
      if (!interaction.member.voice.channel) {
        return interaction.editReply({ 
          content: "Kamu perlu berada di voice channel untuk memutar musik!",
          ephemeral: true
        });
      }
      
      // Mendapatkan pengaturan bahasa
      let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id })
      lang = lang?.language || client.language
      lang = require(`../languages/${lang}.js`)

      const stp = interaction.options.getSubcommand()

      if (stp === "playlist") {
        const playlistw = interaction.options.getString("name")
        const playlist = await db?.playlist?.find().catch((e) => {})
        if (!playlist?.length > 0) return interaction.editReply({ content: lang.msg52, ephemeral: true }).catch((e) => {})

        let arr = 0
        for (let i = 0; i < playlist.length; i++) {
          if (playlist[i]?.playlist?.filter((p) => p.name === playlistw)?.length > 0) {
            const playlist_owner_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].author
            const playlist_public_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].public

            if (playlist_owner_filter !== interaction.member.id) {
              if (playlist_public_filter === false) {
                return interaction.editReply({ content: lang.msg53, ephemeral: true }).catch((e) => {})
              }
            }

            const music_filter = playlist[i]?.musics?.filter((m) => m.playlist_name === playlistw)
            if (!music_filter?.length > 0)
              return interaction.editReply({ content: lang.msg54, ephemeral: true }).catch((e) => {})

            await interaction.editReply({ content: lang.msg56 }).catch((e) => {})

            const songs = []
            music_filter.map((m) => songs.push(m.music_url))

            try {
              await client.player.play(interaction.member.voice.channel, songs, {
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
                .catch((e) => {})

              playlist[i]?.playlist
                ?.filter((p) => p.name === playlistw)
                .map(async (p) => {
                  await db.playlist
                    .updateOne(
                      { userID: p.author },
                      {
                        $pull: {
                          playlist: {
                            name: playlistw,
                          },
                        },
                      },
                      { upsert: true },
                    )
                    .catch((e) => {})

                  await db.playlist
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
                            createdTime: p.createdTime,
                          },
                        },
                      },
                      { upsert: true },
                    )
                    .catch((e) => {})
                })
            } catch (e) {
              console.error("Error playing playlist:", e)
              await interaction.editReply({ 
                content: `${lang.msg60}\nError: ${e.message}`,
                ephemeral: true 
              }).catch((e) => {
                console.error("Error updating reply after playlist error:", e);
              })
            }
          } else {
            arr++
            if (arr === playlist.length) {
              return interaction.editReply({ content: lang.msg58, ephemeral: true }).catch((e) => {})
            }
          }
        }
      }

      if (stp === "normal") {
        const name = interaction.options.getString("name")
        if (!name) return interaction.editReply({ content: lang.msg59, ephemeral: true }).catch((e) => {})

        const msg61Embed = new EmbedBuilder()
          .setColor("#474747")
          .setDescription(`${lang.msg61} \`${name}\``)

        // Kirim pesan loading dan SIMPAN referensinya, pastikan fetchReply: true
        const loadingMessage = await interaction.editReply({ embeds: [msg61Embed], fetchReply: true }).catch((e) => {
          console.error("Error updating loading message:", e)
          // Jika gagal mengirim pesan loading awal, mungkin lebih baik return di sini atau tangani errornya
          // Untuk sekarang, kita biarkan lanjut tapi loadingMessage bisa jadi null/undefined
        })

        try {
          console.log(`[DEBUG] Attempting to play: ${name}`)
          console.log(`[DEBUG] Voice channel ID: ${interaction.member.voice.channel.id}`)
          console.log(`[DEBUG] Voice channel name: ${interaction.member.voice.channel.name}`)
          
          // Pakai timeout untuk memberi waktu koneksi voice channel terbentuk dulu
          setTimeout(async () => {
            try {
              // Langsung gunakan pencarian normal tanpa prefix
              // DisTube akan otomatis mencari di semua sumber dan SoundCloud biasanya berhasil
              await client.player.play(interaction.member.voice.channel, name, {
                member: interaction.member,
                textChannel: interaction.channel,
                metadata: {
                  interaction: interaction,
                  loadingMessage: loadingMessage // Teruskan referensi pesan loading
                },
                // Konfigurasi tambahan untuk DisTube agar lebih stabil
                skip: false,
                position: 0
              });
              
              // Tidak perlu update interaksi lagi, biarkan events/player/playSong.js yang handle
              
            } catch (playError) {
              console.error("[DEBUG] Play error object:", JSON.stringify(playError, null, 2));
              console.error("[DEBUG] Play error code:", playError.errorCode);
              console.error("[DEBUG] Play error message:", playError.message);

              const isSpotifyLink = name.includes("open.spotify.com");
              
              // Default error messages (Anda bisa memindahkannya ke file bahasa Anda)
              let defaultErrorMsg = lang.errorPlay || "Gagal memutar musik. Silakan coba lagi.";
              let spotifyErrorMsg = lang.errorSpotifyPlay || "Gagal memutar dari link Spotify. Pastikan link valid, lagu-lagu dalam playlist dapat ditemukan di platform lain (YouTube/SoundCloud), dan konfigurasi API Spotify bot sudah benar.";
              let spotifyNoResultMsg = lang.errorSpotifyNoResult || "Tidak ada lagu yang dapat ditemukan dari link Spotify tersebut (mungkin tidak tersedia di YouTube/SoundCloud). Pastikan playlist publik dan berisi lagu yang populer.";
              let spotifyApiErrorMsg = lang.errorSpotifyApi || "Terjadi masalah dengan API Spotify (kemungkinan rate limit atau masalah kunci API). Harap hubungi admin bot.";
              let voiceConnectErrorMsg = lang.errorVoiceConnect || "Tidak dapat terhubung ke voice channel. Pastikan bot memiliki izin yang tepat.";
              let noResultErrorMsg = lang.errorNoResult || "Tidak dapat menemukan musik yang diminta. Coba gunakan kata kunci yang berbeda.";

              let errorMessage = defaultErrorMsg;

              if (isSpotifyLink) {
                errorMessage = spotifyErrorMsg;
                if (playError.errorCode === 'NO_RESULT' || (playError.message && playError.message.toLowerCase().includes("no track found"))) {
                  errorMessage = spotifyNoResultMsg;
                } else if (playError.message && (playError.message.toLowerCase().includes("rate limit") || playError.message.toLowerCase().includes("api key") || playError.message.toLowerCase().includes("authentication failed") || playError.message.toLowerCase().includes("invalid client"))) {
                  errorMessage = spotifyApiErrorMsg;
                }
              } else {
                if (playError.errorCode === 'VOICE_CONNECT_FAILED') {
                  errorMessage = voiceConnectErrorMsg;
                } else if (playError.errorCode === 'NO_RESULT') {
                  errorMessage = noResultErrorMsg;
                }
              }
              
              // Pastikan interaksi masih bisa diedit
              if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                  content: errorMessage,
                  embeds: [],
                  components: [] 
                }).catch(e => console.error("Error updating error message to user:", e));
              } else {
                console.error("[CRITICAL] Interaction was not replied or deferred, cannot edit reply for playError.");
              }
            }
          }, 2000); // Tunggu 2 detik sebelum memutar

        } catch (e) {
          console.error("[DEBUG] Outer play error:", e);
          await interaction.editReply({
            content: `${lang.msg60}\nError: ${e.message}`,
            embeds: [],
          }).catch(e => console.error("Error replying after outer error:", e));
        }
      }
    } catch (e) {
      console.error("Top-level play command error:", e);
      
      try {
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: "Terjadi kesalahan saat menjalankan perintah. Silakan coba lagi nanti.",
            ephemeral: true
          }).catch(e => {});
        } else if (interaction.deferred) {
          await interaction.editReply({
            content: "Terjadi kesalahan saat memproses perintah. Silakan coba lagi nanti.",
            ephemeral: true
          }).catch(e => {});
        }
      } catch (replyError) {
        console.error("Error handling top-level error:", replyError);
      }
      
      const errorNotifer = require("../functions.js")
      errorNotifer(client, interaction, e, lang)
    }
  },
}
