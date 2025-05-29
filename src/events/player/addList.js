const { dbService } = require("../../services/core");
const { EmbedBuilder } = require("discord.js");

module.exports = async (client, queue, playlist) => {
  try {
    let lang = await dbService?.musicbot?.findOne({
      guildID: queue?.textChannel?.guild?.id,
    });
    lang = lang?.language || client.language;
    lang = require(`../../../languages/${lang}.js`);
    
    // Deteksi sumber playlist
    const isSpotify = playlist?.source === 'spotify';
    const isCustom = playlist?.source === 'custom';
    const isYouTube = playlist?.source === 'youtube' || playlist?.source === 'youtube-music';
    const isSoundCloud = playlist?.source === 'soundcloud';
    
    // Pastikan nama playlist ada, jika tidak gunakan "Unknown Playlist"
    const playlistName = playlist?.name || "Unknown Playlist";
    
    let playlistEmbed;
    
    if (isSpotify) {
      // Desain untuk Spotify
      playlistEmbed = new EmbedBuilder()
        .setColor("#1DB954") // Warna Spotify
        .setAuthor({ 
          name: lang.spotify_playlist || "Spotify Playlist", 
          iconURL: 'https://i.imgur.com/rJPeWvQ.png' 
        })
        .setTitle(playlistName)
        .addFields(
          { name: lang.enqueued || "Enqueued", value: `${playlist?.songs?.length || 0} ${lang.songs || "songs"}`, inline: true },
          { name: lang.owner || "Owner", value: `${playlist?.user?.username || playlist?.member?.user?.username || 'Unknown'}`, inline: true },
          { name: lang.duration || "Duration", value: playlist?.formattedDuration || '00:00', inline: true }
        )
        .setDescription(lang.spotify_desc || "Spotify playlist")
        .setThumbnail(playlist?.thumbnail || playlist?.songs?.[0]?.thumbnail || "https://i.imgur.com/JSosB9H.png");
    } else if (isCustom) {
      // Desain untuk playlist kustom
      playlistEmbed = new EmbedBuilder()
        .setColor("#3498DB") // Biru default
        .setAuthor({ 
          name: lang.custom_playlist || "Custom Playlist", 
          iconURL: client.user.displayAvatarURL() 
        })
        .setTitle(playlistName)
        .addFields(
          { name: lang.enqueued || "Enqueued", value: `${playlist?.songs?.length || 0} ${lang.songs || "songs"}`, inline: true },
          { name: lang.owner || "Owner", value: `${playlist?.user?.username || playlist?.member?.user?.username || 'Unknown'}`, inline: true },
          { name: lang.duration || "Duration", value: playlist?.formattedDuration || '00:00', inline: true }
        )
        .setDescription(lang.custom_playlist_desc || "Custom playlist of saved songs")
        .setThumbnail(playlist?.thumbnail || playlist?.songs?.[0]?.thumbnail || "https://i.imgur.com/JSosB9H.png")
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    } else {
      // Desain untuk platform lainnya (YouTube, SoundCloud, dll)
      const platformName = isYouTube ? 'YouTube' : isSoundCloud ? 'SoundCloud' : 'Music';
      const platformColor = isYouTube ? '#FF0000' : isSoundCloud ? '#FF7700' : '#3498DB';
      const platformIcon = isYouTube ? 'https://cdn3.emoji.gg/emojis/33006-youtube-music.png' : 
                          isSoundCloud ? 'https://cdn3.emoji.gg/emojis/27987-soundcloud.png' : 
                          'https://i.imgur.com/JSosB9H.png';
      
      // Deskripsi khusus berdasarkan platform
      let platformDescription = `${lang.msg62 || "Music playlist"}`;
      
      if (isYouTube) {
        platformDescription = lang.youtube_desc || platformDescription;
      } else if (isSoundCloud) {
        platformDescription = lang.soundcloud_desc || platformDescription;
      }
      
      playlistEmbed = new EmbedBuilder()
        .setColor(platformColor)
        .setAuthor({ 
          name: `${platformName} ${(lang.music_playlist || "Music Playlist").toLowerCase()}`, 
          iconURL: platformIcon 
        })
        .setTitle(playlistName)
        .addFields(
          { name: lang.msg116 || "songs", value: `${playlist?.songs?.length || 0}`, inline: true },
          { name: lang.added_by || "Added by", value: `${playlist?.user?.username || playlist?.member?.user?.username || 'Unknown'}`, inline: true },
          { name: lang.duration || "Duration", value: playlist?.formattedDuration || '00:00', inline: true }
        )
        .setDescription(platformDescription)
        .setImage(playlist?.thumbnail || playlist?.songs?.[0]?.thumbnail || "https://i.imgur.com/JSosB9H.png")
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
    }
    
    // Cek apakah loadingMessage masih valid
    if (playlist?.metadata?.loadingMessage && typeof playlist.metadata.loadingMessage.edit === 'function') {
      try {
        // Cek apakah pesan masih valid
        const isValidMessage = playlist.metadata.loadingMessage.channelId && !playlist.metadata.loadingMessage.deleted;
        
        if (isValidMessage) {
          const playlistMessage = await playlist.metadata.loadingMessage.edit({
            content: isSpotify ? null : `<@${playlist?.user?.id || playlist?.member?.id || "unknown"}>`,
            embeds: [playlistEmbed]
          }).catch(err => {
            // Jika error Unknown Message, kirim pesan baru
            if (err.code === 10008) {
              console.log(`[DEBUG][addList.js] Message not found, sending new message instead`);
              if (queue && queue.textChannel) {
                return queue.textChannel.send({
                  content: isSpotify ? null : `<@${playlist?.user?.id || playlist?.member?.id || "unknown"}>`,
                  embeds: [playlistEmbed]
                });
              }
            }
            console.error(`[DEBUG][addList.js] Error editing message:`, err);
          });
          
          // Simpan playlistMessage di queue.metadata
          if (playlistMessage && queue) {
            queue.metadata = queue.metadata || {};
            queue.metadata.playlistMessage = playlistMessage;
            queue.metadata.playlistMessageId = playlistMessage.id;
          }
        } else {
          // Jika pesan tidak valid dan ada queue, kirim pesan baru
          if (queue && queue.textChannel) {
            const newMessage = await queue.textChannel.send({
              content: isSpotify ? null : `<@${playlist?.user?.id || playlist?.member?.id || "unknown"}>`,
              embeds: [playlistEmbed]
            });
            
            // Simpan pesan baru di queue.metadata
            if (newMessage && queue) {
              queue.metadata = queue.metadata || {};
              queue.metadata.playlistMessage = newMessage;
              queue.metadata.playlistMessageId = newMessage.id;
            }
          }
        }
      } catch (e) {
        console.error(`[DEBUG][addList.js] Error handling message:`, e);
        
        // Coba kirim pesan baru jika terjadi error dan ada queue
        if (queue && queue.textChannel) {
          try {
            const errorMessage = await queue.textChannel.send({
              content: isSpotify ? null : `<@${playlist?.user?.id || playlist?.member?.id || "unknown"}>`,
              embeds: [playlistEmbed]
            });
            
            // Simpan errorMessage di queue.metadata
            if (errorMessage) {
              queue.metadata = queue.metadata || {};
              queue.metadata.playlistMessage = errorMessage;
              queue.metadata.playlistMessageId = errorMessage.id;
            }
          } catch (sendError) {
            console.error(`[DEBUG][addList.js] Error sending new message:`, sendError);
          }
        }
      }
    } else {
      // Jika tidak ada loadingMessage, kirim pesan baru jika ada queue
      if (queue && queue.textChannel) {
        try {
          const newPlaylistMessage = await queue.textChannel.send({
            content: isSpotify ? null : `<@${playlist?.user?.id || playlist?.member?.id || "unknown"}>`,
            embeds: [playlistEmbed]
          });
          
          // Simpan newPlaylistMessage di queue.metadata
          if (newPlaylistMessage) {
            queue.metadata = queue.metadata || {};
            queue.metadata.playlistMessage = newPlaylistMessage;
            queue.metadata.playlistMessageId = newPlaylistMessage.id;
          }
        } catch (sendError) {
          console.error(`[DEBUG][addList.js] Error sending new message:`, sendError);
        }
      }
    }
  } catch (error) {
    console.error("[CRITICAL][addList.js] Error in addList event handler:", error);
  }
};

// Fungsi untuk menentukan platform berdasarkan data playlist
function getPlatformName(playlist) {
  if (playlist.url) {
    if (playlist.url.includes('youtube')) return 'YouTube';
    if (playlist.url.includes('soundcloud')) return 'SoundCloud';
  }
  return 'Music';
}

// Fungsi untuk mendapatkan warna platform
function getPlatformColor(playlist) {
  if (playlist.url) {
    if (playlist.url.includes('youtube')) return '#FF0000'; // Merah YouTube
    if (playlist.url.includes('soundcloud')) return '#FF7700'; // Oranye SoundCloud
  }
  return '#3498DB'; // Biru default
}

// Fungsi untuk mendapatkan ikon platform
function getPlatformIcon(playlist) {
  if (playlist.url) {
    if (playlist.url.includes('youtube')) return 'https://cdn3.emoji.gg/emojis/33006-youtube-music.png'; // Ikon YouTube
    if (playlist.url.includes('soundcloud')) return 'https://cdn3.emoji.gg/emojis/27987-soundcloud.png'; // Ikon SoundCloud
  }
  return 'https://i.imgur.com/JSosB9H.png'; // Ikon default
}
