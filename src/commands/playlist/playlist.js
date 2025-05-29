const {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { dbService } = require("../../services/core");
const { loadLanguage } = require("../../utils/languageLoader");
const YouTubeMusicPlugin = require("ytmusic-distube-plugin");
console.log("[DEBUG] Playlist command loaded with new db.js");
module.exports = {
  name: "playlist",
  description: "Lets you manage playlist commands.",
  options: [
    {
      name: "create",
      description: "Create a playlist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [        {
          name: "name",
          description: "Write the name of the playlist you want to create.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "public",
          description:
            "Make the playlist public. (true=public playlist, false=private playlist)",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        },
      ],
    },
    {
      name: "delete",
      description: "Delete a playlist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Write the name of the playlist you want to delete.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "add-music",
      description: "It allows you to add music to the playlist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "playlist-name",
          description: "Write a playlist name.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "name",
          description: "Write a music name or a music link.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "delete-music",
      description: "It allows you to delete music to the playlist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "playlist-name",
          description: "Write a playlist name.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "name",
          description: "Write a music name.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "list",
      description: "Browse music in a playlist.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Write a playlist name.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
      ],
    },
    {
      name: "lists",
      description: "Browse all your playlists.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "public",
          description: "Filter by public status. true=show all public playlists, false=show your playlists only",
          type: ApplicationCommandOptionType.Boolean,
          required: true,
        }
      ]
    },
    {
      name: "top",
      description: "Most popular playlists.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [],
    },
  ],
  permissions: "0x0000000000000800",
  run: async (client, interaction) => {
    let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });
    const langCode = dbLang?.language || client.language;
    const lang = loadLanguage(langCode);
    try {
      let stp = interaction.options.getSubcommand();      if (stp === "create") {
        let name = interaction.options.getString("name");
        let public = interaction.options.getBoolean("public");
        
        if (!name) {
          return await interaction
            .reply({ content: lang.msg91, ephemeral: true })
            .catch((e) => {});
        }
        
        console.log(`[DEBUG] Creating playlist "${name}" for user ${interaction.user.id}, public: ${public}, guild: ${interaction.guild.id}`);
        
        try {
          const userplaylist = await dbService.playlist.findOne({
            userID: interaction.user.id,
            guildID: interaction.guild.id
          });

          // Validasi duplikat playlist
          if (public) {
            // Validasi untuk playlist public
            const userPlaylists = await dbService.playlist.findOne({
              userID: interaction.user.id
            });
            
            if (userPlaylists?.playlist?.some(p => p.name === name)) {
              return await interaction
                .reply({ content: `${lang.msg92} Anda sudah memiliki playlist dengan nama "${name}".`, ephemeral: true })
                .catch((e) => {});
            }
            
            const publicPlaylistsInGuild = await dbService.playlist.find({
              guildID: interaction.guild.id
            });
            
            let duplicatePublicFound = false;
            if (publicPlaylistsInGuild?.length > 0) {
              for (const otherUserPlaylists of publicPlaylistsInGuild) {
                if (otherUserPlaylists.userID === interaction.user.id) continue;
                
                if (otherUserPlaylists?.playlist?.some(p => p.name === name && p.public === true)) {
                  duplicatePublicFound = true;
                  break;
                }
              }
            }
            
            if (duplicatePublicFound) {
              return await interaction
                .reply({ content: `${lang.msg92} Nama playlist sudah digunakan playlist public lain di server ini.`, ephemeral: true })
                .catch((e) => {});
            }
          } else {
            // Validasi untuk playlist private
            const allUserPlaylists = await dbService.playlist.findOne({
              userID: interaction.user.id
            });
            
            if (allUserPlaylists?.playlist?.some(p => p.name === name)) {
              return await interaction
                .reply({ content: lang.msg92, ephemeral: true })
                .catch((e) => {});
            }
          }

          // Cek batas maksimum playlist
          if (userplaylist?.playlist?.length >= client.config.playlistSettings.maxPlaylist) {
            return await interaction
              .reply({ content: lang.msg93, ephemeral: true })
              .catch((e) => {});
          }

          await interaction
            .reply({ content: `<@${interaction.member.id}>, ${lang.msg94}` })
            .catch((e) => {});

          // Simpan playlist baru
          await dbService.playlist.updateOne(
            { userID: interaction.user.id },
            {
              $push: {
                playlist: {
                  name: name,
                  author: interaction.user.id,
                  authorTag: interaction.user.tag,
                  public: public,
                  plays: 0,
                  createdTime: Date.now(),
                  guildId: interaction.guild.id
                },
              },
            },
            { upsert: true }
          );

          await interaction
            .editReply({ content: `<@${interaction.member.id}>, ${lang.msg95}` })
            .catch((e) => {});
            
        } catch (error) {
          console.error("[ERROR] Error in playlist creation:", error);
          
          // Handle response berdasarkan status interaction
          const errorMessage = `Error: ${error.message}`;
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true }).catch(e => {});
          } else {
            await interaction.editReply({ content: errorMessage }).catch(e => {});
          }
        }
      }      if (stp === "delete") {
        let name = interaction.options.getString("name");
        if (!name) {
          return await interaction
            .reply({ content: lang.msg93, ephemeral: true })
            .catch((e) => {});
        }

        try {
          // Cek apakah user memiliki playlist dengan nama tersebut
          const userPlaylist = await dbService.playlist.findOne({
            userID: interaction.user.id
          });
          
          if (!userPlaylist?.playlist?.some(p => p.name === name)) {
            return await interaction
              .reply({ content: "Playlist tidak ditemukan.", ephemeral: true })
              .catch((e) => {});
          }
          
          await interaction.reply({ content: lang.msg94 }).catch((e) => {});
          
          // Hapus playlist dan semua musik di dalamnya
          await dbService.playlist.updateOne(
            { userID: interaction.user.id },
            {
              $pull: {
                playlist: { name: name },
                musics: { playlist_name: name }
              }
            }
          );
          
          await interaction
            .editReply({ content: lang.msg95 })
            .catch((e) => {});
            
        } catch (error) {
          console.error("[ERROR] Error in delete playlist operation:", error);
          
          const errorMessage = `Error: ${error.message}`;
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMessage, ephemeral: true });
          } else {
            await interaction.editReply({ content: errorMessage });
          }
        }
      }

      if (stp === "add-music") {
        let name = interaction.options.getString("name");
        let playlist_name = interaction.options.getString("playlist-name");
        if (!name)
          return await interaction
            .reply({ content: lang.msg104, ephemeral: true })
            .catch((e) => {});
        if (!playlist_name)
          return await interaction
            .reply({ content: lang.msg105, ephemeral: true })
            .catch((e) => {});        try {
          await interaction.reply({ content: lang.msg106 }).catch((e) => {});
          
          const playlist = await dbService.playlist
            .findOne({ userID: interaction.user.id })
            .catch((e) => {});
          if (
            !playlist?.playlist?.filter((p) => p.name === playlist_name).length >
            0
          )
            return interaction
              .reply({ content: lang.msg96, ephemeral: true })
              .catch((e) => {});

          let max_music = client.config.playlistSettings.maxMusic;
          if (
            playlist?.musics?.filter((m) => m.playlist_name === playlist_name)
              .length > max_music
          )
            return interaction
              .reply({
                content: lang.msg101.replace("{max_music}", max_music),
                ephemeral: true,
              })
              .catch((e) => {});
            
          // Deteksi apakah input adalah URL
          const isURL = name.match(/^https?:\/\//i);
          const isSpotify = name.match(/^(https?:\/\/)?(open.spotify.com|spotify.com|spotify)\/(.*)$/i);
          const isYouTube = name.match(/^(https?:\/\/)?(www\.|music\.)?(youtube.com|youtu.be)\/(.*)$/i);
          const isSoundCloud = name.match(/^(https?:\/\/)?(soundcloud.com)\/(.*)$/i);
          
          // Jika input adalah URL tapi bukan pencarian
          if (isURL) {
            let source = "unknown";
            let isPlaylist = false;

            if (isSpotify) {
              source = "spotify";
              isPlaylist = name.includes('/playlist/') || name.includes('/album/');
            } else if (isYouTube) {
              source = "youtube";
              isPlaylist = name.includes('list=') || name.includes('/playlist');
            } else if (isSoundCloud) {
              source = "soundcloud";
              isPlaylist = name.includes('/sets/');
            }

            await interaction
              .reply({ content: `<@${interaction.member.id}>, ${lang.msg102} dari ${source}...` })
              .catch((e) => {});

            try {
              // Jika ini adalah playlist
              if (isPlaylist) {
                // Resolve playlist menggunakan DisTube
                const resolvedPlaylist = await client.player.handler.resolve(name, {
                  member: interaction.member,
                  metadata: { requestedBy: interaction.user.tag }
                });
                
                if (!resolvedPlaylist || !resolvedPlaylist.songs || resolvedPlaylist.songs.length === 0) {
                  return interaction
                    .editReply({ content: `Tidak dapat menemukan lagu dari playlist ${source}`, ephemeral: true })
                    .catch((e) => {});
                }
                
                const currentMusicsCount = playlist?.musics?.filter(m => m.playlist_name === playlist_name).length || 0;
                const willAddCount = resolvedPlaylist.songs.length;
                
                // Cek jika akan melebihi batas maksimum
                if (currentMusicsCount + willAddCount > max_music) {
                  return interaction
                    .editReply({
                      content: `Tidak dapat menambahkan ${willAddCount} lagu karena akan melebihi batas maksimum ${max_music} lagu per playlist. Saat ini sudah ada ${currentMusicsCount} lagu.`,
                      ephemeral: true
                    })
                    .catch((e) => {});
                }
                
                // Update progres
                await interaction
                  .editReply({ content: `<@${interaction.member.id}>, Menambahkan ${resolvedPlaylist.songs.length} lagu dari ${resolvedPlaylist.name || `${source} playlist`}...` })
                  .catch((e) => {});
                
                // Tambahkan semua lagu ke playlist
                let addedCount = 0;
                for (const song of resolvedPlaylist.songs) {
                  // Cek apakah lagu sudah ada di playlist
                  const music_filter = playlist?.musics?.filter(
                    (m) => m.playlist_name === playlist_name && (m.music_url === song.url || m.music_name === song.name)
                  );
                  
                  if (music_filter?.length > 0) continue; // Skip jika sudah ada
                  
                  // Tambahkan lagu ke database
                  await dbService.playlist.updateOne(
                    { userID: interaction.user.id },
                    {
                      $push: {
                        musics: {
                          playlist_name: playlist_name,
                          music_name: song.name,
                          music_url: song.url,
                          music_thumbnail: song.thumbnail || null,
                          music_duration: song.duration || 0,
                          music_source: source,
                          saveTime: Date.now(),
                        },
                      },
                    },
                    { upsert: true }
                  ).catch((e) => console.error(`Error adding song to playlist:`, e));
                  
                  addedCount++;
                }
                
                // Selesai
                await interaction
                  .editReply({
                    content: `<@${interaction.member.id}>, Berhasil menambahkan ${addedCount} lagu dari "${resolvedPlaylist.name || `${source} playlist`}" ke playlist Anda`
                  })
                  .catch((e) => {});
                
                return;
              } else {
                // Ini adalah lagu tunggal
                const resolvedSong = await client.player.handler.resolve(name, {
                  member: interaction.member,
                  metadata: { requestedBy: interaction.user.tag }
                });
                
                if (!resolvedSong) {
                  return interaction
                    .editReply({ content: `Tidak dapat menemukan lagu dari ${source}`, ephemeral: true })
                    .catch((e) => {});
                }
                
                // Cek apakah lagu sudah ada di playlist
                const music_filter = playlist?.musics?.filter(
                  (m) => m.playlist_name === playlist_name && (m.music_url === resolvedSong.url || m.music_name === resolvedSong.name)
                );
                
                if (music_filter?.length > 0) {
                  return interaction
                    .editReply({ content: lang.msg104, ephemeral: true })
                    .catch((e) => {});
                }
                
                // Tambahkan lagu ke database
                await dbService.playlist
                  .updateOne(
                    { userID: interaction.user.id },
                    {
                      $push: {
                        musics: {
                          playlist_name: playlist_name,
                          music_name: resolvedSong.name,
                          music_url: resolvedSong.url,
                          music_thumbnail: resolvedSong.thumbnail || null,
                          music_duration: resolvedSong.duration || 0,
                          music_source: source,
                          saveTime: Date.now(),
                        },
                      },
                    },
                    { upsert: true }
                  )
                  .catch((e) => {});
                
                await interaction
                  .editReply({
                    content: `<@${interaction.member.id}>, \`${resolvedSong.name}\` ${lang.msg105}`
                  })
                  .catch((e) => {});
                
                return;
              }
            } catch (e) {
              console.error(`Error processing ${source} link:`, e);
              return interaction
                .editReply({ content: `Error: ${e.message || `Tidak dapat memproses link ${source}`}`, ephemeral: true })
                .catch((e) => {});
            }
          }
          
          // Jika bukan URL, gunakan pencarian YouTube Music seperti sebelumnya
          let res;
          try {
            const plugin = client.player.plugins.find(p => p instanceof YouTubeMusicPlugin);
            
            res = await plugin.searchSongs(name, { 
              limit: 3
            });
          } catch (e) {
            return interaction
              .reply({ content: lang.msg74, ephemeral: true })
              .catch((e) => {});
          }
          if (!res || !res.length || !res.length > 1)
            return interaction
              .reply({ content: lang.msg74, ephemeral: true })
              .catch((e) => {});

          await interaction
            .reply({ content: `<@${interaction.member.id}>, ${lang.msg102}` })
            .catch((e) => {});

          const music_filter = playlist?.musics?.filter(
            (m) =>
              m.playlist_name === playlist_name && m.music_name === res[0]?.name
          );
          if (music_filter?.length > 0)
            return interaction
              .editReply({ content: lang.msg104, ephemeral: true })
              .catch((e) => {});

          await dbService.playlist
            .updateOne(
              { userID: interaction.user.id },
              {
                $push: {
                  musics: {
                    playlist_name: playlist_name,
                    music_name: res[0]?.name,
                    music_url: res[0]?.url,
                    music_thumbnail: res[0]?.thumbnail || null,
                    music_duration: res[0]?.duration || 0,
                    music_source: res[0]?.source || "youtube-music",
                    saveTime: Date.now(),
                  },
                },
              },
              { upsert: true }
            )
            .catch((e) => {});

          await interaction
            .editReply({
              content: `<@${interaction.member.id}>, \`${res[0]?.name}\` ${lang.msg105}`,
            })
            .catch((e) => {});
        } catch (error) {
          console.error("[ERROR] Error in add-music operation:", error);
          return interaction
            .editReply({ content: `Error: ${error.message}` })
            .catch((e) => {});
        }
      }

      if (stp === "delete-music") {
        let name = interaction.options.getString("name");
        let playlist_name = interaction.options.getString("playlist-name");
        if (!name)
          return interaction
            .reply({ content: lang.msg107, ephemeral: true })
            .catch((e) => {});
        if (!playlist_name)
          return interaction
            .reply({ content: lang.msg108, ephemeral: true })
            .catch((e) => {});        try {
          const playlist = await dbService.playlist
            .findOne({ userID: interaction.user.id })
            .catch((e) => {
              console.error("[ERROR] Error finding playlist:", e);
            });
            
          if (!playlist) {
            console.log("[DEBUG] Playlist not found for user", interaction.user.id);
            return interaction
              .reply({ content: lang.msg96, ephemeral: true })
              .catch((e) => {});
          }
            
          if (!playlist?.playlist?.filter((p) => p.name === playlist_name).length) {
            console.log(`[DEBUG] Playlist "${playlist_name}" not found in user's playlists`);
            return interaction
              .reply({ content: lang.msg96, ephemeral: true })
              .catch((e) => {});
          }

          const music_filter = playlist?.musics?.filter(
            (m) => m.playlist_name === playlist_name && m.music_name === name
          );
          
          console.log(`[DEBUG] Found ${music_filter?.length || 0} matching tracks to delete`);
          
          if (!music_filter?.length)
            return interaction
              .reply({ content: lang.msg54, ephemeral: true })
              .catch((e) => {});

          await interaction
            .reply({ content: `<@${interaction.member.id}>, ${lang.msg108}` })
            .catch((e) => {
              console.error("[ERROR] Failed to send initial reply:", e);
            });

          console.log(`[DEBUG] Calling db.playlist.updateOne to remove track`);
          
          const result = await dbService.playlist
            .updateOne(
              { userID: interaction.user.id },
              {
                $pull: {
                  musics: {
                    playlist_name: playlist_name,
                    music_name: name,
                  },
                },
              }
            )
            .catch((e) => {
              console.error("[ERROR] Failed to delete music:", e);
            });
            
          console.log(`[DEBUG] Delete result:`, result);

          await interaction
            .editReply({ content: `<@${interaction.member.id}>, ${lang.msg109}` })
            .catch((e) => {
              console.error("[ERROR] Failed to edit reply:", e);
            });
        } catch (error) {
          console.error("[ERROR] Error in delete-music operation:", error);
          
          // Try to respond if we haven't already
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({ 
                content: `An error occurred while deleting the track: ${error.message}`, 
                ephemeral: true 
              });
            } else {
              await interaction.editReply({ 
                content: `An error occurred while deleting the track: ${error.message}`
              });
            }
          } catch (e) {
            console.error("[ERROR] Failed to send error response:", e);
          }
        }
      }

      if (stp === "list") {
        let name = interaction.options.getString("name");
        if (!name)
          return interaction
            .reply({ content: lang.msg110, ephemeral: true })
            .catch((e) => {});

        let trackl;

        const playlist = await dbService.playlist.find().catch((e) => {});
        if (!playlist?.length)
          return interaction
            .reply({ content: lang.msg96, ephemeral: true })
            .catch((e) => {});

        let arr = 0;
        for (let i = 0; i < playlist.length; i++) {
          if (
            playlist[i]?.playlist?.filter((p) => p.name === name)?.length > 0
          ) {
            let playlist_owner_filter = playlist[i].playlist.filter(
              (p) => p.name === name
            )[0].author;
            let playlist_public_filter = playlist[i].playlist.filter(
              (p) => p.name === name
            )[0].public;

            if (playlist_owner_filter !== interaction.member.id) {
              if (playlist_public_filter === false) {
                return interaction
                  .reply({ content: lang.msg53, ephemeral: true })
                  .catch((e) => {});
              }
            }

            trackl = await playlist[i]?.musics?.filter(
              (m) => m.playlist_name === name
            );
            if (!trackl?.length)
              return interaction
                .reply({ content: lang.msg111, ephemeral: true })
                .catch((e) => {});
          } else {
            arr++;
            if (arr === playlist.length) {
              return interaction
                .reply({ content: lang.msg58, ephemeral: true })
                .catch((e) => {});
            }
          }
        }

        const backId = "emojiBack";
        const forwardId = "emojiForward";
        const backButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "⬅️",
          customId: backId,
        });

        const deleteButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "❌",
          customId: "close",
        });

        const forwardButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "➡️",
          customId: forwardId,
        });

        let kaçtane = 8;
        let page = 1;
        let a = trackl.length / kaçtane;        const generateEmbed = async (start) => {
          let sayı = page === 1 ? 1 : page * kaçtane - kaçtane + 1;
          const current = trackl.slice(start, start + kaçtane);
          if (!current || !current?.length)
            return interaction
              .reply({ content: lang.msg111, ephemeral: true })
              .catch((e) => {});
          return new EmbedBuilder()
            .setTitle(`${name}`)
            .setThumbnail(
              interaction.user.displayAvatarURL({ size: 2048, dynamic: true })
            )
            .setColor(client.config.embedColor)
            .setDescription(
              `${lang.msg119}\n${current.map(
                (data) =>
                  `\n\`${sayı++}\` | [${data.music_name}](${
                    data.music_url
                  }) ${data.music_duration ? `- \`${formatDuration(data.music_duration)}\`` : ''} ${data.music_source ? `- [${getSourceIcon(data.music_source)}]` : ''} - <t:${Math.floor(data.saveTime / 1000)}:R>`
              )}`
            )
            .setFooter({ text: `${lang.msg67} ${page}/${Math.floor(a + 1)}` });
        };

        const canFitOnOnePage = trackl.length <= kaçtane;

        await interaction
          .reply({
            embeds: [await generateEmbed(0)],
            components: canFitOnOnePage
              ? []
              : [
                  new ActionRowBuilder({
                    components: [deleteButton, forwardButton],
                  }),
                ],
            fetchReply: true,
          })
          .then(async (Message) => {
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = Message.createMessageComponentCollector({
              filter,
              time: 65000,
            });

            let currentIndex = 0;
            collector.on("collect", async (button) => {
              if (button.customId === "close") {
                collector.stop();
                return button
                  .reply({ content: `${lang.msg68}`, ephemeral: true })
                  .catch((e) => {});
              } else {
                if (button.customId === backId) {
                  page--;
                }
                if (button.customId === forwardId) {
                  page++;
                }

                button.customId === backId
                  ? (currentIndex -= kaçtane)
                  : (currentIndex += kaçtane);

                await interaction
                  .editReply({
                    embeds: [await generateEmbed(currentIndex)],
                    components: [
                      new ActionRowBuilder({
                        components: [
                          ...(currentIndex ? [backButton] : []),
                          deleteButton,
                          ...(currentIndex + kaçtane < trackl.length
                            ? [forwardButton]
                            : []),
                        ],
                      }),
                    ],
                  })
                  .catch((e) => {});
                await button.deferUpdate().catch((e) => {});
              }
            });

            collector.on("end", async (button) => {
              button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⬅️")
                  .setCustomId(backId)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("❌")
                  .setCustomId("close")
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("➡️")
                  .setCustomId(forwardId)
                  .setDisabled(true)
              );

              const embed = new EmbedBuilder()
                .setTitle(`${name}`)
                .setThumbnail(
                  interaction.user.displayAvatarURL({
                    size: 2048,
                    dynamic: true,
                  })
                )
                .setColor(client.config.embedColor)
                .setDescription(lang.msg118.replace("{name}", name))
                .setFooter({ text: `Parrhesia 🌀` });
              return interaction
                .editReply({ embeds: [embed], components: [button] })
                .catch((e) => {});
            });
          })
          .catch((e) => {});
      }      if (stp === "lists") {
        // Defer reply immediately to prevent timeout
        await interaction.deferReply();
        
        // Ambil parameter public jika ada
        const showPublic = interaction.options.getBoolean("public");
        console.log(`[DEBUG] Listing playlists with public filter: ${showPublic}`);
        
        try {
            if (showPublic === true) {
            // Jika public=true, tampilkan semua playlist public di server ini
            console.log(`[DEBUG] Showing public playlists in guild ${interaction.guild.id}`);
            
            // Cari semua playlist yang memiliki playlist public di server ini
            const accessiblePlaylists = await dbService.playlist.find({}).catch((e) => {
              console.error("[ERROR] Error finding public playlists:", e);
              return [];
            });
            
            if (!accessiblePlaylists || accessiblePlaylists.length === 0) {
              return interaction
                .editReply({ content: "Tidak ada playlist public yang tersedia di server ini.", ephemeral: true })
                .catch((e) => {});
            }
            
            // Kumpulkan semua playlist public di server ini
            let allPublicPlaylists = [];
            
            accessiblePlaylists.forEach(userPlaylist => {
              if (userPlaylist.playlist && Array.isArray(userPlaylist.playlist)) {
                userPlaylist.playlist.forEach(playlist => {
                  if (playlist.public && playlist.guildId === interaction.guild.id) {
                    // Tambahkan informasi user ke playlist
                    const enrichedPlaylist = {
                      ...playlist,
                      userID: userPlaylist.userID || userPlaylist.id,
                      musics: userPlaylist.musics?.filter(m => m.playlist_name === playlist.name) || []
                    };
                    allPublicPlaylists.push(enrichedPlaylist);
                  }
                });
              }
            });
            
            // Jika tidak ada playlist public
            if (allPublicPlaylists.length === 0) {
              return interaction
                .editReply({ content: "Tidak ada playlist public yang tersedia di server ini.", ephemeral: true })
                .catch((e) => {});
            }
            
            // Sort berdasarkan popularitas (plays)
            allPublicPlaylists.sort((a, b) => (b.plays || 0) - (a.plays || 0));
            
            let number = 1;
            const embed = new EmbedBuilder()
              .setTitle("🌐 Public Playlists")
              .setColor(client.config.embedColor)
              .setDescription(
                `${lang.msg119}\n${allPublicPlaylists.map(
                  (playlist) => {
                    // Hitung total durasi playlist
                    const totalDuration = playlist.musics.reduce((acc, song) => acc + (song.music_duration || 0), 0);
                    const formattedDuration = formatDuration(totalDuration);
                    
                    // Menentukan mayoritas sumber lagu
                    const sources = {};
                    playlist.musics.forEach((song) => {
                      if (song.music_source) {
                        sources[song.music_source] = (sources[song.music_source] || 0) + 1;
                      }
                    });
                    
                    let majoritySource = '';
                    let maxCount = 0;
                    for (const [source, count] of Object.entries(sources)) {
                      if (count > maxCount) {
                        maxCount = count;
                        majoritySource = source;
                      }
                    }
                    
                    const sourceIcon = getSourceIcon(majoritySource);
                    const authorInfo = playlist.authorTag ? ` by \`${playlist.authorTag}\`` : '';
                    
                    return `\n**${number++} |** \`${playlist.name}\` ${sourceIcon} 🌐 ${authorInfo} - **${
                      playlist.musics.length || 0
                    }** ${lang.msg116} - \`${formattedDuration}\` (<t:${Math.floor(
                      playlist.createdTime / 1000
                    )}:R>)`;
                  }
                )}`
              )
              .setFooter({ text: `Parrhesia 🌀 | Server: ${interaction.guild.name}` });
            
            return interaction.editReply({ embeds: [embed] }).catch((e) => {});          } else {
            // Jika public=false atau null, tampilkan playlist milik user ini
            const userPlaylists = await dbService.playlist.findOne({ 
              userID: interaction.user.id
            }).catch((e) => {
              console.error("[ERROR] Error finding user playlists:", e);
              return null;
            });
                if (!userPlaylists?.playlist?.length) {
              return interaction
                .editReply({ content: lang.msg117, ephemeral: true })
                .catch((e) => {});
            }
            
            let number = 1;
            const embed = new EmbedBuilder()
              .setTitle(lang.msg115)
              .setColor(client.config.embedColor)
              .setDescription(
                `${lang.msg119}\n${userPlaylists?.playlist?.map(
                  (data) => {
                    // Hitung total durasi playlist
                    const playlistSongs = userPlaylists?.musics?.filter((m) => m.playlist_name === data.name) || [];
                    const totalDuration = playlistSongs.reduce((acc, song) => acc + (song.music_duration || 0), 0);
                    const formattedDuration = formatDuration(totalDuration);
                    
                    // Menentukan mayoritas sumber lagu
                    const sources = {};
                    playlistSongs.forEach((song) => {
                      if (song.music_source) {
                        sources[song.music_source] = (sources[song.music_source] || 0) + 1;
                      }
                    });
                    
                    let majoritySource = '';
                    let maxCount = 0;
                    for (const [source, count] of Object.entries(sources)) {
                      if (count > maxCount) {
                        maxCount = count;
                        majoritySource = source;
                      }
                    }
                    
                    const sourceIcon = getSourceIcon(majoritySource);
                    const visibilityIcon = data.public ? '🌐' : '🔒';
                    
                    return `\n**${number++} |** \`${data.name}\` ${sourceIcon} ${visibilityIcon} - **${
                      playlistSongs.length || 0
                    }** ${lang.msg116} - \`${formattedDuration}\` (<t:${Math.floor(
                      data.createdTime / 1000
                    )}:R>)`;
                  }
                )}`
              )
              .setFooter({ text: `Parrhesia 🌀` });
            return interaction.editReply({ embeds: [embed] }).catch((e) => {});
          }        } catch (error) {
          console.error("[ERROR] Error in lists subcommand:", error);
          if (interaction.deferred) {
            return await interaction.editReply({ content: `Error: ${error.message}`, ephemeral: true }).catch(e => {});
          } else {
            return await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true }).catch(e => {});
          }
        }
      }      if (stp === "top") {
        let playlists = await dbService?.playlist?.find({}).catch((e) => {});if (!playlists?.length)
          return await interaction
            .reply({ content: lang.msg114, ephemeral: true })
            .catch((e) => {});        let trackl = [];
        playlists.map(async (data) => {
          data.playlist
            .filter((d) => d.public === true && d.guildId === interaction.guild.id)
            .map(async (d) => {
              let filter = data.musics.filter(
                (m) => m.playlist_name === d.name
              );
              if (filter.length > 0) {
                trackl.push(d);
              }
            });
        });

        trackl = trackl.filter((a) => a.plays > 0);

        if (!trackl?.length)
          return interaction
            .reply({ content: lang.msg114, ephemeral: true })
            .catch((e) => {});

        trackl = trackl.sort((a, b) => b.plays - a.plays);

        const backId = "emojiBack";
        const forwardId = "emojiForward";
        const backButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "⬅️",
          customId: backId,
        });

        const deleteButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "❌",
          customId: "close",
        });

        const forwardButton = new ButtonBuilder({
          style: ButtonStyle.Secondary,
          emoji: "➡️",
          customId: forwardId,
        });

        let kaçtane = 8;
        let page = 1;
        let a = trackl.length / kaçtane;        const generateEmbed = async (start) => {
          let sayı = page === 1 ? 1 : page * kaçtane - kaçtane + 1;
          const current = trackl.slice(start, start + kaçtane);
          if (!current || !current?.length)
            return interaction
              .reply({ content: lang.msg114, ephemeral: true })
              .catch((e) => {});
          return new EmbedBuilder()
            .setTitle(lang.msg112)
            .setThumbnail(
              interaction.user.displayAvatarURL({ size: 2048, dynamic: true })
            )
            .setColor(client.config.embedColor)
            .setDescription(
              `${lang.msg119}\n${current.map(
                (data) =>
                  `\n**${sayı++} |** \`${data.name}\` By. \`${
                    data.authorTag
                  }\` - **${data.plays}** ${lang.msg129} (<t:${Math.floor(
                    data.createdTime / 1000
                  )}:R>)`
              )}`
            )
            .setFooter({ text: `${lang.msg67} ${page}/${Math.floor(a + 1)}` });
        };

        const canFitOnOnePage = trackl.length <= kaçtane;

        await interaction
          .reply({
            embeds: [await generateEmbed(0)],
            components: canFitOnOnePage
              ? []
              : [
                  new ActionRowBuilder({
                    components: [deleteButton, forwardButton],
                  }),
                ],
            fetchReply: true,
          })
          .then(async (Message) => {
            const filter = (i) => i.user.id === interaction.user.id;
            const collector = Message.createMessageComponentCollector({
              filter,
              time: 120000,
            });

            let currentIndex = 0;
            collector.on("collect", async (button) => {
              if (button.customId === "close") {
                collector.stop();
                return button
                  .reply({ content: `${lang.msg68}`, ephemeral: true })
                  .catch((e) => {});
              } else {
                if (button.customId === backId) {
                  page--;
                }
                if (button.customId === forwardId) {
                  page++;
                }

                button.customId === backId
                  ? (currentIndex -= kaçtane)
                  : (currentIndex += kaçtane);

                await interaction
                  .editReply({
                    embeds: [await generateEmbed(currentIndex)],
                    components: [
                      new ActionRowBuilder({
                        components: [
                          ...(currentIndex ? [backButton] : []),
                          deleteButton,
                          ...(currentIndex + kaçtane < trackl.length
                            ? [forwardButton]
                            : []),
                        ],
                      }),
                    ],
                  })
                  .catch((e) => {});
                await button.deferUpdate().catch((e) => {});
              }
            });

            collector.on("end", async (button) => {
              button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("⬅️")
                  .setCustomId(backId)
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("❌")
                  .setCustomId("close")
                  .setDisabled(true),
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji("➡️")
                  .setCustomId(forwardId)
                  .setDisabled(true)
              );

              const embed = new EmbedBuilder()
                .setTitle(lang.msg112)
                .setThumbnail(
                  interaction.user.displayAvatarURL({
                    size: 2048,
                    dynamic: true,
                  })
                )
                .setColor(client.config.embedColor)
                .setDescription(lang.msg113)
                .setFooter({ text: `Parrhesia 🌀` });
              return interaction
                .editReply({ embeds: [embed], components: [button] })
                .catch((e) => {});
            });
          })
          .catch((e) => {});
      }
    } catch (e) {
      const errorNotifer = require("../../utils/functions.js");
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

// Fungsi untuk mendapatkan ikon sumber musik
function getSourceIcon(source) {
  switch(source && source.toLowerCase()) {
    case 'spotify':
      return '🟢';
    case 'youtube':
    case 'youtube-music':
      return '🔴';
    case 'soundcloud':
      return '🟠';
    case 'custom':
      return '🎵';
    default:
      return '🎧';
  }
}