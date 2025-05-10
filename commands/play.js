const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const db = require("../mongoDB");
const spotifyMetadata = require("../spotifyMetadata");
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

        const isSpotifyLink = name.includes("open.spotify.com");
        
        // Buat embed loading awal
        const loadingEmbed = new EmbedBuilder()
          .setColor("#474747")
          .setDescription(`${lang.msg61} \`${name}\``);
        
        // Kirim pesan loading dan SIMPAN referensinya, pastikan fetchReply: true
        const loadingMessage = await interaction.editReply({ 
          embeds: [loadingEmbed], 
          fetchReply: true 
        }).catch((e) => {
          console.error("Error updating loading message:", e);
        });

        try {
          // Jika ini adalah link Spotify, kita perlu mengekstrak metadata
          if (isSpotifyLink) {
            try {
              // Update pesan loading untuk menunjukkan kita sedang memproses Spotify
              const spotifyLoadingEmbed = new EmbedBuilder()
                .setColor("#1DB954") // Warna hijau Spotify
                .setDescription(`🎵 Mengambil data Spotify untuk \`${name}\`...`);
              
              await loadingMessage.edit({ 
                embeds: [spotifyLoadingEmbed] 
              }).catch(e => {
                console.error("Error updating Spotify loading message:", e);
              });
              
              // Ekstrak metadata Spotify
              const spotifyData = await spotifyMetadata.getSpotifyMetadata(name, client.config);
              
              // Buat pesan loading yang diperkaya dengan data Spotify
              let enhancedEmbed;
              let searchQueries = [];
              
              if (spotifyData.type === 'track') {
                enhancedEmbed = new EmbedBuilder()
                  .setColor("#1DB954")
                  .setTitle(`🎵 Memuat Track Spotify`)
                  .setDescription(`**[${spotifyData.name}](${spotifyData.spotifyUrl})**`)
                  .setThumbnail(spotifyData.album.images[0]?.url)
                  .addFields(
                    { name: "Artis", value: `\`${spotifyData.artistNames}\``, inline: true },
                    { name: "Album", value: `\`${spotifyData.album.name}\``, inline: true }
                  )
                  .setFooter({ text: "Mencari track ini di YouTube..." });
                
                // Buat query pencarian untuk track tunggal
                searchQueries.push({
                  title: spotifyData.name,
                  artist: spotifyData.artistNames,
                  fullQuery: `${spotifyData.name} ${spotifyData.artistNames}`
                });
                
              } else if (spotifyData.type === 'playlist') {
                enhancedEmbed = new EmbedBuilder()
                  .setColor("#1DB954")
                  .setTitle(`🎵 Memuat Playlist Spotify`)
                  .setDescription(`**[${spotifyData.name}](${spotifyData.spotifyUrl})**`)
                  .setThumbnail(spotifyData.images[0]?.url)
                  .addFields(
                    { name: "Pembuat", value: `\`${spotifyData.owner.name}\``, inline: true },
                    { name: "Jumlah Track", value: `\`${spotifyData.totalTracks}\``, inline: true }
                  )
                  .setFooter({ text: `Memuat ${Math.min(spotifyData.tracks.length, 25)} track dari playlist...` });
                
                // Batasi jumlah track yang diambil untuk menghindari rate limit (max 25)
                const tracksToPlay = spotifyData.tracks.slice(0, 25);
                
                // Buat query pencarian untuk setiap track dalam playlist
                tracksToPlay.forEach(track => {
                  searchQueries.push({
                    title: track.name,
                    artist: track.artists,
                    fullQuery: `${track.name} ${track.artists}`
                  });
                });
                
              } else if (spotifyData.type === 'album') {
                enhancedEmbed = new EmbedBuilder()
                  .setColor("#1DB954")
                  .setTitle(`🎵 Memuat Album Spotify`)
                  .setDescription(`**[${spotifyData.name}](${spotifyData.spotifyUrl})**`)
                  .setThumbnail(spotifyData.images[0]?.url)
                  .addFields(
                    { name: "Artis", value: `\`${spotifyData.artistNames}\``, inline: true },
                    { name: "Jumlah Track", value: `\`${spotifyData.totalTracks}\``, inline: true }
                  )
                  .setFooter({ text: `Memuat ${Math.min(spotifyData.tracks.length, 25)} track dari album...` });
                
                // Batasi jumlah track yang diambil untuk menghindari rate limit (max 25)
                const tracksToPlay = spotifyData.tracks.slice(0, 25);
                
                // Buat query pencarian untuk setiap track dalam album
                tracksToPlay.forEach(track => {
                  searchQueries.push({
                    title: track.name,
                    artist: spotifyData.artistNames,
                    fullQuery: `${track.name} ${spotifyData.artistNames}`
                  });
                });
              }
              
              // Update pesan loading dengan info Spotify yang diperkaya
              if (enhancedEmbed) {
                await loadingMessage.edit({ 
                  embeds: [enhancedEmbed] 
                }).catch(e => {
                  console.error("Error updating enhanced Spotify embed:", e);
                });
              }
              
              // Jika kita punya beberapa track (playlist/album), putar sebagai playlist
              if (searchQueries.length > 0) {
                try {
                  // Buat status update untuk user
                  const statusEmbed = new EmbedBuilder()
                    .setColor("#1DB954")
                    .setTitle(`🎵 Mencari Track di YouTube`)
                    .setDescription(`Mencari ${searchQueries.length} track dari Spotify...`)
                    .setFooter({ text: "Ini mungkin memerlukan waktu beberapa saat" });
                  
                  await loadingMessage.edit({ 
                    embeds: [statusEmbed] 
                  }).catch(e => {});
                  
                  // Fungsi untuk memainkan lagu pertama dan menambahkan sisanya ke antrian
                  const playFirstAndQueueRest = async () => {
                    // Ambil query pertama
                    const firstQuery = searchQueries[0];
                    console.log(`[INFO] Memainkan track pertama: ${firstQuery.fullQuery}`);
                    
                    try {
                      console.log(`[DEBUG] Attempting to play the sec: ${searchQueries[0]}`);

                      // Mainkan track pertama

                      await client.player.play(interaction.member.voice.channel, firstQuery.fullQuery, {
                        member: interaction.member,
                        textChannel: interaction.channel,
                        metadata: {
                          interaction: interaction,
                          loadingMessage: loadingMessage,
                          spotifyData: spotifyData
                        }
                      });
                      
                      // Jika hanya ada satu track, kita selesai
                      if (searchQueries.length === 1) return;

                      // Tunggu queue terbentuk
                      await new Promise(resolve => setTimeout(resolve, 3000));
                      
                      // Dapatkan queue yang baru dibuat
                      const queue = client.player.getQueue(interaction.guild.id);
                      
                      if (!queue) {
                        console.error("[ERROR] Queue tidak terbentuk setelah memainkan track pertama");
                        return;
                      }
                      
                      // Update status
                      const queueingEmbed = new EmbedBuilder()
                        .setColor("#1DB954")
                        .setTitle(`🎵 Menambahkan Track ke Antrian`)
                        .setDescription(`Track pertama dimulai. Menambahkan ${searchQueries.length - 1} track lainnya ke antrian...`)
                        .setFooter({ text: "Mohon tunggu..." });
                      
                      await loadingMessage.edit({ 
                        embeds: [queueingEmbed] 
                      }).catch(e => {});
                      
                      // Tambahkan track lainnya ke antrian satu per satu
                      let addedCount = 0;
                      
                      for (let i = 1; i < searchQueries.length; i++) {
                        const query = searchQueries[i];
                        console.log(`[INFO] Menambahkan ke antrian: ${query.fullQuery}`);
                        
                        try {
                          // Coba beberapa format query untuk meningkatkan peluang menemukan lagu
                          const queryVariations = [
                            query.fullQuery,                                // Format normal: judul artis
                            `${query.title} ${query.artist} lyrics`,        // Tambahkan "lyrics" untuk membantu pencarian
                            `${query.title} ${query.artist} official`,      // Tambahkan "official" untuk membantu pencarian
                            `${query.title} ${query.artist} official audio` // Tambahkan "official audio" untuk membantu pencarian
                          ];
                          
                          let added = false;
                          
                          // Coba setiap variasi query sampai berhasil
                          for (const variation of queryVariations) {
                            try {
                              await client.player.play(interaction.member.voice.channel, variation, {
                                member: interaction.member,
                                textChannel: interaction.channel,
                                metadata: {
                                  interaction: null, // Tidak perlu update pesan untuk track antrian
                                  loadingMessage: null,
                                  spotifyData: null,
                                  playlistBatchPlay: true 
                                }
                              });
                              
                              added = true;
                              addedCount++;
                              console.log(`[SUCCESS] Berhasil menambahkan: ${variation}`);
                              break; // Keluar dari loop jika berhasil
                            } catch (variationError) {
                              console.log(`[INFO] Gagal dengan variasi: ${variation}, mencoba variasi lain...`);
                              continue; // Coba variasi berikutnya
                            }
                          }
                          
                          if (!added) {
                            console.error(`[WARNING] Tidak dapat menambahkan track: ${query.fullQuery} setelah mencoba semua variasi`);
                          }
                          
                          // Tunggu sebentar antara setiap penambahan untuk menghindari rate limit
                          await new Promise(resolve => setTimeout(resolve, 1500));
                          
                          // Update status setiap 5 track
                          if (i % 5 === 0 || i === searchQueries.length - 1) {
                            const progressEmbed = new EmbedBuilder()
                              .setColor("#1DB954")
                              .setTitle(`🎵 Menambahkan Track ke Antrian`)
                              .setDescription(`Berhasil menambahkan ${addedCount} dari ${i} track ke antrian...`)
                              .setFooter({ text: `Progress: ${Math.round((i / (searchQueries.length - 1)) * 100)}%` });
                            
                            await loadingMessage.edit({ 
                              embeds: [progressEmbed] 
                            }).catch(e => {});
                          }
                          
                        } catch (addError) {
                          console.error(`[ERROR] Gagal menambahkan track ke antrian: ${addError.message}`);
                          continue; // Lanjutkan ke track berikutnya jika yang ini gagal
                        }
                      }
                      
                      // Update status final
                      const finalEmbed = new EmbedBuilder()
                        .setColor("#1DB954")
                        .setTitle(`🎵 Playlist Spotify Dimuat`)
                        .setDescription(`Berhasil menambahkan ${addedCount} dari ${searchQueries.length - 1} track ke antrian`)
                        .setThumbnail(spotifyData.images?.[0]?.url || null)
                        .setFooter({ text: "Gunakan /queue untuk melihat antrian" });
                      
                      await loadingMessage.edit({ 
                        embeds: [finalEmbed] 
                      }).catch(e => {});
                      
                    } catch (firstTrackError) {
                      console.error("[ERROR] Gagal memainkan track pertama:", firstTrackError);
                      throw firstTrackError;
                    }
                  };
                  
                  // Jalankan fungsi untuk memainkan dan mengantri
                  await playFirstAndQueueRest();
                  
                } catch (playlistError) {
                  console.error("[ERROR] Gagal memutar playlist Spotify:", playlistError);
                  
                  // Coba metode alternatif jika gagal
                  const alternativeEmbed = new EmbedBuilder()
                    .setColor("#FFA500") // Orange for alternative method
                    .setTitle(`🔄 Mencoba Metode Alternatif`)
                    .setDescription(`Mencoba memainkan dengan kata kunci dari judul playlist`)
                    .setFooter({ text: "Ini mungkin tidak sempurna tapi lebih baik daripada tidak ada" });
                  
                  await loadingMessage.edit({ 
                    embeds: [alternativeEmbed] 
                  }).catch(e => {});
                  
                  // Coba mainkan dengan judul playlist + nama artis sebagai query
                  try {
                    let alternativeQuery = "";
                    
                    if (spotifyData.type === 'playlist') {
                      alternativeQuery = spotifyData.name;
                    } else if (spotifyData.type === 'album') {
                      alternativeQuery = `${spotifyData.name} ${spotifyData.artistNames}`;
                    } else {
                      alternativeQuery = `${spotifyData.name} ${spotifyData.artistNames}`;
                    }
                    
                    console.log(`[INFO] Mencoba metode alternatif dengan query: ${alternativeQuery}`);
                    
                    await client.player.play(interaction.member.voice.channel, alternativeQuery, {
                      member: interaction.member,
                      textChannel: interaction.channel,
                      metadata: {
                        interaction: interaction,
                        loadingMessage: loadingMessage,
                        spotifyData: spotifyData
                      }
                    });
                    
                  } catch (alternativeError) {
                    console.error("[ERROR] Metode alternatif gagal:", alternativeError);
                    throw alternativeError;
                  }
                }
              } else {
                throw new Error("Tidak ada track yang ditemukan di Spotify");
              }
              
            } catch (spotifyError) {
              console.error("[ERROR] Spotify processing error:", spotifyError);
              
              // Update pesan dengan error
              const errorEmbed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(`❌ Error Spotify`)
                .setDescription(`Gagal memproses link Spotify: ${spotifyError.message}`)
                .setFooter({ text: "Mencoba metode alternatif..." });
              
              await loadingMessage.edit({ 
                embeds: [errorEmbed] 
              }).catch(e => {});
              
              // Coba metode alternatif: gunakan nama playlist/album sebagai query pencarian
              try {
                const alternativeEmbed = new EmbedBuilder()
                  .setColor("#FFA500") // Orange for alternative method
                  .setTitle(`🔄 Mencoba Metode Alternatif`)
                  .setDescription(`Mencari musik dengan kata kunci dari URL Spotify`)
                  .setFooter({ text: "Ini mungkin tidak sempurna tapi lebih baik daripada tidak ada" });
                
                await loadingMessage.edit({ 
                  embeds: [alternativeEmbed] 
                }).catch(e => {});
                
                // Ekstrak nama dari URL Spotify
                let searchTerm = "";
                if (name.includes("/track/")) {
                  searchTerm = "track " + name.split("/track/")[1].split("?")[0];
                } else if (name.includes("/playlist/")) {
                  searchTerm = "playlist " + name.split("/playlist/")[1].split("?")[0];
                } else if (name.includes("/album/")) {
                  searchTerm = "album " + name.split("/album/")[1].split("?")[0];
                }
                
                // Jika tidak bisa mengekstrak, gunakan URL sebagai fallback
                if (!searchTerm) searchTerm = name;
                
                // Putar dengan query alternatif
                setTimeout(async () => {
                  try {
                    await client.player.play(interaction.member.voice.channel, searchTerm, {
                      member: interaction.member,
                      textChannel: interaction.channel,
                      metadata: {
                        interaction: interaction,
                        loadingMessage: loadingMessage
                      }
                    });
                  } catch (fallbackError) {
                    console.error("[ERROR] Fallback play error:", fallbackError);
                    
                    // Update pesan dengan error fallback
                    const fallbackErrorEmbed = new EmbedBuilder()
                      .setColor("#FF0000")
                      .setTitle(`❌ Gagal Memutar`)
                      .setDescription(`Tidak dapat memutar dari Spotify: ${fallbackError.message}`)
                      .setFooter({ text: "Pastikan link valid dan coba lagi nanti" });
                    
                    await loadingMessage.edit({ 
                      embeds: [fallbackErrorEmbed] 
                    }).catch(e => {});
                  }
                }, 2000);
              } catch (alternativeError) {
                console.error("[ERROR] Alternative method error:", alternativeError);
                
                // Jika metode alternatif juga gagal, coba langsung saja
                setTimeout(async () => {
                  try {
                    await client.player.play(interaction.member.voice.channel, name, {
                      member: interaction.member,
                      textChannel: interaction.channel,
                      metadata: {
                        interaction: interaction,
                        loadingMessage: loadingMessage
                      }
                    });
                  } catch (directError) {
                    console.error("[ERROR] Direct play error:", directError);
                    
                    // Update pesan dengan error langsung
                    const directErrorEmbed = new EmbedBuilder()
                      .setColor("#FF0000")
                      .setTitle(`❌ Gagal Memutar`)
                      .setDescription(`Semua metode gagal: ${directError.message}`)
                      .setFooter({ text: "Coba gunakan link YouTube sebagai alternatif" });
                    
                    await loadingMessage.edit({ 
                      embeds: [directErrorEmbed] 
                    }).catch(e => {});
                  }
                }, 2000);
              }
            }
          } else {
            // Bukan link Spotify, putar seperti biasa
            console.log(`[DEBUG] Attempting to play: ${name}`);
            if (interaction.member.voice.channel) {
              console.log(`[DEBUG] Voice channel ID: ${interaction.member.voice.channel.id}`);
              console.log(`[DEBUG] Voice channel name: ${interaction.member.voice.channel.name}`);
            }
            
            // Pakai timeout untuk memberi waktu koneksi voice channel terbentuk dulu
            setTimeout(async () => {
              try {
                await client.player.play(interaction.member.voice.channel, name, {
                  member: interaction.member,
                  textChannel: interaction.channel,
                  metadata: {
                    interaction: interaction,
                    loadingMessage: loadingMessage
                  }
                });
                
              } catch (playError) {
                console.error("[DEBUG] Play error:", playError);
                
                // Default error messages
                let errorMessage = lang.errorPlay || "Gagal memutar musik. Silakan coba lagi.";
                let noResultErrorMsg = lang.errorNoResult || "Tidak dapat menemukan musik yang diminta. Coba gunakan kata kunci yang berbeda.";
                let voiceConnectErrorMsg = lang.errorVoiceConnect || "Tidak dapat terhubung ke voice channel. Pastikan bot memiliki izin yang tepat.";
                
                if (playError.errorCode === 'VOICE_CONNECT_FAILED') {
                  errorMessage = voiceConnectErrorMsg;
                } else if (playError.errorCode === 'NO_RESULT') {
                  errorMessage = noResultErrorMsg;
                }
                
                // Update pesan dengan error
                const errorEmbed = new EmbedBuilder()
                  .setColor("#FF0000")
                  .setTitle(`❌ Error`)
                  .setDescription(errorMessage)
                  .setFooter({ text: "Silakan coba lagi dengan query yang berbeda" });
                
                await loadingMessage.edit({ 
                  embeds: [errorEmbed],
                  content: null
                }).catch(e => console.error("Error updating error message:", e));
              }
            }, 2000);
          }
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
      
      errorNotifer(client, interaction, e, lang);
    }
  },
};