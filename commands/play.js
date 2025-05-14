const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const db = require("../mongoDB");
const { errorNotifer } = require("../functions.js");

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
      let lang = await db?.musicbot?.findOne({ guildID: interaction.guild.id });
      lang = lang?.language || client.language;
      lang = require(`../languages/${lang}.js`);

      const stp = interaction.options.getSubcommand();

      if (stp === "playlist") {
        // Handle custom playlist feature
        const playlistw = interaction.options.getString("name");
        const playlist = await db?.playlist?.find().catch((e) => {});
        if (!playlist?.length > 0) return interaction.editReply({ content: lang.msg52, ephemeral: true }).catch((e) => {});

        let arr = 0;
        for (let i = 0; i < playlist.length; i++) {
          if (playlist[i]?.playlist?.filter((p) => p.name === playlistw)?.length > 0) {
            const playlist_owner_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].author;
            const playlist_public_filter = playlist[i].playlist.filter((p) => p.name === playlistw)[0].public;

            if (playlist_owner_filter !== interaction.member.id) {
              if (playlist_public_filter === false) {
                return interaction.editReply({ content: lang.msg53, ephemeral: true }).catch((e) => {});
              }
            }

            const music_filter = playlist[i]?.musics?.filter((m) => m.playlist_name === playlistw);
            if (!music_filter?.length > 0)
              return interaction.editReply({ content: lang.msg54, ephemeral: true }).catch((e) => {});

            await interaction.editReply({ content: lang.msg56 }).catch((e) => {});

            const songs = [];
            music_filter.map((m) => songs.push(m.music_url));

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
                .catch((e) => {});

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
                    .catch((e) => {});

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
                    .catch((e) => {});
                });
            } catch (e) {
              console.error("Error playing playlist:", e);
              await interaction.editReply({ 
                content: `${lang.msg60}\nError: ${e.message}`,
                ephemeral: true 
              }).catch((e) => {
                console.error("Error updating reply after playlist error:", e);
              });
            }
          } else {
            arr++;
            if (arr === playlist.length) {
              return interaction.editReply({ content: lang.msg58, ephemeral: true }).catch((e) => {});
            }
          }
        }
      }

      if (stp === "normal") {
        const name = interaction.options.getString("name");
        if (!name) return interaction.editReply({ content: lang.msg59, ephemeral: true }).catch((e) => {});

        // Buat embed loading yang lebih menarik
        const loadingEmbed = new EmbedBuilder()
          .setColor("#474747")
          .setDescription(`${lang.msg61} \`${name}\``);
        
        // Kirim pesan loading
        const loadingMessage = await interaction.editReply({ 
          embeds: [loadingEmbed], 
          fetchReply: true 
        }).catch(e => {
          console.error("Error sending loading message:", e);
        });

        console.log(`[DEBUG][/play] Loading Embed: ${loadingMessage.id}`)

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
          
          await loadingMessage.edit({ 
            embeds: [errorEmbed],
            content: null
          }).catch(e => console.error("Error updating error message:", e));
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
      
      errorNotifer(client, interaction, e, lang);
    }
  },
};