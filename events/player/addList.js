const db = require("../../mongoDB");
const { EmbedBuilder } = require("discord.js");

module.exports = async (client, queue, playlist) => {
  let lang = await db?.musicbot?.findOne({
    guildID: queue?.textChannel?.guild?.id,
  });
  lang = lang?.language || client.language;
  lang = require(`../../languages/${lang}.js`);
  
  // Cek apakah playlist dari Spotify
  const isSpotify = playlist.name.toLowerCase().includes('spotify') || 
                  (playlist.url && playlist.url.includes('spotify')) || 
                  playlist.source === 'spotify';
  
  let playlistEmbed;
  
  if (isSpotify) {
    // Desain untuk Spotify
    playlistEmbed = new EmbedBuilder()
      .setColor("#1DB954") // Warna Spotify
      .setAuthor({ name: lang.spotify_playlist, iconURL: 'https://i.imgur.com/rJPeWvQ.png' })
      .setTitle(playlist.name)
      .addFields(
        { name: lang.enqueued, value: `${playlist.songs.length} ${lang.songs}`, inline: true },
        { name: lang.owner, value: `${playlist.user.username || 'Unknown'}`, inline: true },
        { name: lang.playlist_link, value: `[${lang.click_here}](https://discord.com)`, inline: true }
      )
      .setDescription(lang.spotify_desc)
      .setThumbnail(playlist.thumbnail || playlist.songs[0]?.thumbnail || "https://i.imgur.com/JSosB9H.png");
  } else {
    // Desain untuk platform lainnya (YouTube, SoundCloud, dll)
    const platformName = getPlatformName(playlist);
    const platformColor = getPlatformColor(playlist);
    const platformIcon = getPlatformIcon(playlist);
    
    // Deskripsi khusus berdasarkan platform
    let platformDescription = `${lang.msg62}`;
    
    if (platformName === 'YouTube') {
      platformDescription = lang.youtube_desc;
    } else if (platformName === 'SoundCloud') {
      platformDescription = lang.soundcloud_desc;
    }
    
    playlistEmbed = new EmbedBuilder()
      .setColor(platformColor)
      .setAuthor({ name: `${platformName} ${lang.music_playlist.toLowerCase()}`, iconURL: platformIcon })
      .setTitle(playlist.name)
      .addFields(
        { name: lang.msg116, value: `${playlist.songs.length}`, inline: true },
        { name: lang.added_by, value: `${playlist.user.username || 'Unknown'}`, inline: true }
      )
      .setDescription(platformDescription)
      .setImage(playlist.thumbnail || playlist.songs[0]?.thumbnail || "https://i.imgur.com/JSosB9H.png")
      .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
  }
  
  playlist.metadata?.loadingMessage.edit({
      content: isSpotify ? null : `<@${playlist.user.id}>`,
      embeds: [playlistEmbed]
    })
    .catch((e) => {});
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
