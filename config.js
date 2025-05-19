const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  TOKEN: process.env.DISCORD_TOKEN || "",
  ownerID: [], //write your discord user id. example: ["id"] or ["id1","id2"]
  botInvite: "", //write your discord bot invite.
  supportServer: "", //write your discord bot support server invite.
  mongodbURL: process.env.MONGODB_URL || "mongodb+srv://abiyyurahid20:tokoobat123@abiyyuuu.0unjwd1.mongodb.net/?retryWrites=true&w=majority",
  status: "https://abiyyufahri.rf.gd",
  commandsDir: "./commands", //Please don't touch
  language: "en", //en, tr, nl, pt, fr, ar, zh_TW, it, ja
  embedColor: "ffa954", //hex color code
  errorLog: "", //write your discord error log channel id.
  aboutMe:
    "Saya adalah bot yang luar biasa! Saya dikembangkan oleh Muhammad Abiyyu Al-Ghifari dan saya siap untuk membantu server Discord Anda. Saya bisa memutar musik, mengelola daftar putar, dan banyak lagi. Jangan ragu untuk mengundang saya ke server Anda dan gunakan perintah `!help` untuk melihat apa yang bisa saya lakukan!",
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID || "307e0aea9f96440bb786017403156447",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "601794c1cb4f434b8808634cd94e69d0",

    // VM mengguanakn : 3001
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3002/callback" // URI untuk autentikasi Spotify
  },

  sponsor: {
    status: true, //true or false
    url: "https://abiyyufahri.my.id", //write your discord sponsor url.
  },

  voteManager: {
    //optional
    status: false, //true or false
    api_key: "", //write your top.gg api key.
    vote_commands: [
      "back",
      "channel",
      "clear",
      "dj",
      "filter",
      "loop",
      "nowplaying",
      "pause",
      "play",
      "playlist",
      "queue",
      "resume",
      "save",
      "search",
      "skip",
      "stop",
      "time",
      "volume",
    ], //write your use by vote commands.
    vote_url: "", //write your top.gg vote url.
  },

  shardManager: {
    shardStatus: false, //If your bot exists on more than 1000 servers, change this part to true.
  },

  playlistSettings: {
    maxPlaylist: 100, //max playlist count
    maxMusic: 120, //max music count
  },

  opt: {
    DJ: {
      commands: [
        "back",
        "clear",
        "filter",
        "loop",
        "pause",
        "resume",
        "skip",
        "stop",
        "volume",
        "shuffle",
      ], //Please don't touch
    },

    voiceConfig: {
      leaveOnFinish: false, //If this variable is "true", the bot will leave the channel the music ends.
      leaveOnStop: false, //If this variable is "true", the bot will leave the channel when the music is stopped.

      leaveOnEmpty: {
        //The leaveOnEnd variable must be "false" to use this system.
        status: true, //If this variable is "true", the bot will leave the channel when the bot is offline.
        cooldown: 10000000, //1000 = 1 second
      },
    },

    maxVol: 150, //You can specify the maximum volume level.
  },
}; 