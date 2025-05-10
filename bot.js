const { Client, GatewayIntentBits, Partials } = require("discord.js")
const { DisTube } = require("distube")
const { SpotifyPlugin } = require("@distube/spotify")
const { SoundCloudPlugin } = require("@distube/soundcloud")
const { DeezerPlugin } = require("@distube/deezer")
const { YtDlpPlugin } = require("@distube/yt-dlp")
const config = require("./config.js")
const fs = require("fs")

// Import ffmpeg-static to register its path in the environment
const ffmpegPath = require("ffmpeg-static")
// Register the FFmpeg path to be found by DisTube
process.env.FFMPEG_PATH = ffmpegPath

// Load opusscript for Node.js v20 compatibility
require("opusscript")

// Log system information for debugging
console.log(`[SYSTEM] Node.js version: ${process.version}`);
console.log(`[SYSTEM] Platform: ${process.platform} ${process.arch}`);
console.log(`[SYSTEM] FFmpeg path: ${ffmpegPath}`);
console.log(`[SYSTEM] Discord.js version: ${require("discord.js").version}`);
console.log(`[SYSTEM] DisTube version: ${require("distube").version}`);

const client = new Client({
  partials: [
    Partials.Channel, // for text channel
    Partials.GuildMember, // for guild member
    Partials.User, // for discord user
  ],
  intents: [
    GatewayIntentBits.Guilds, // for guild related things
    GatewayIntentBits.GuildMembers, // for guild members related things
    GatewayIntentBits.GuildIntegrations, // for discord Integrations
    GatewayIntentBits.GuildVoiceStates, // for voice related things
  ],
})

// Import lebih banyak komponen voice untuk penanganan yang lebih baik
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

client.config = config
client.player = new DisTube(client, {
  // Opsi valid menurut dokumentasi DisTube v5
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  
  plugins: [
    new YtDlpPlugin({
      update: true
    }),
    new SpotifyPlugin({
      api: {
        clientId: client.config.spotify?.clientId,
        clientSecret: client.config.spotify?.clientSecret
      }
    }),
    new SoundCloudPlugin(),
    new DeezerPlugin()
  ],
  

  
  nsfw: false,
  joinNewVoiceChannel: false
})

const player = client.player

// Event handler untuk DisTube v5
client.player.on("error", (channel, error) => {
  console.error("[CRITICAL] DisTube error:", error)
  if (channel) {
    try {
      channel.send(`❌ Error terjadi: ${error.message.slice(0, 1979)}`).catch(e => 
        console.error("Failed to send error message to channel:", e)
      );
    } catch (sendError) {
      console.error("Error while sending error notification:", sendError);
    }
  }
})

// Improved connection error handling
client.player.on("connectionError", (queue, error) => {
  console.error(`[CRITICAL] Connection error in guild ${queue?.textChannel?.guild?.id}:`, error);
  
  if (queue?.textChannel) {
    queue.textChannel.send("⚠️ Terjadi masalah koneksi. Mencoba menghubungkan kembali...").catch(e => {
      console.error("Failed to send connection error message:", e);
    });
  }
  
  // Try to fix the connection
  setTimeout(() => {
    try {
      if (queue && queue.voice && queue.voice.channel) {
        console.log("[RECOVERY] Attempting to rejoin voice channel after connection error");
        
        // Force disconnect and reconnect to fix issues
        queue.voice.leave();
        
        // Wait a bit then reconnect
        setTimeout(() => {
          try {
            if (queue.songs.length > 0) {
              const channel = queue.voice.channel;
              queue.connect();
              console.log("[RECOVERY] Successfully reconnected to voice channel");
            }
          } catch (reconnectError) {
            console.error("[RECOVERY] Failed to reconnect:", reconnectError);
          }
        }, 2000);
      }
    } catch (recoveryError) {
      console.error("[RECOVERY] Error in recovery process:", recoveryError);
    }
  }, 1000);
})

client.player.on("disconnect", (queue) => {
  console.log(`[INFO] Bot disconnected from voice channel in guild ${queue.textChannel?.guild?.id}`);
  
  if (queue?.textChannel) {
    queue.textChannel.send("I disconnected because there is no one left in my channel.").catch(e => {
      console.error("Failed to send disconnect message:", e);
    });
  }
  
  // If there are still songs in the queue, try to reconnect
  if (queue && queue.songs && queue.songs.length > 0) {
    setTimeout(() => {
      try {
        console.log("[RECOVERY] Attempting to reconnect after disconnect");
        queue.connect();
      } catch (reconnectError) {
        console.error("[RECOVERY] Failed to reconnect after disconnect:", reconnectError);
      }
    }, 5000); // Wait 5 seconds before attempting to reconnect
  }
})

// Manage voice connections properly with Discord.js voice
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Check if this is our bot
  if (oldState.member.id === client.user.id || newState.member.id === client.user.id) {
    // Bot was disconnected from voice
    if (oldState.channelId && !newState.channelId) {
      console.log(`[VOICE] Bot was disconnected from voice channel ${oldState.channelId}`);
      
      // Get the queue for this guild
      const queue = client.player.getQueue(oldState.guild.id);
      
      if (queue && queue.songs && queue.songs.length > 0) {
        console.log('[VOICE] Queue still has songs, attempting to reconnect');
        
        // Wait a bit and try to reconnect
        setTimeout(() => {
          try {
            queue.connect();
          } catch (reconnectError) {
            console.error('[VOICE] Failed to reconnect after voice state change:', reconnectError);
          }
        }, 3000);
      }
    }
  }
  
  // Someone left the voice channel, check if we should stay
  if (oldState.channelId && 
      oldState.channelId === newState.guild.members.me?.voice?.channelId && 
      oldState.channel.members.size === 1 && 
      oldState.channel.members.has(client.user.id)) {
    
    console.log('[VOICE] Last user left voice channel, will stay connected');
    
    // Send a message that we're alone but staying connected
    const queue = client.player.getQueue(oldState.guild.id);
    if (queue && queue.textChannel) {
      queue.textChannel.send("Everyone left the voice channel, but I'll stay connected for a while.").catch(e => {});
    }
  }
});

client.player.on("empty", (channel) => {
  console.log("[INFO] Voice channel is empty! Leaving the channel.")
  if (channel) channel.send("Semua orang meninggalkan voice channel. Bot akan keluar dari channel.")
})

client.player.on("noRelated", (queue) => {
  console.log("[INFO] Can't find related video to play.")
  if (queue?.textChannel) queue.textChannel.send("Tidak dapat menemukan video terkait untuk diputar. Antrian berakhir.")
})

client.player.on("initQueue", (queue) => {
  console.log("[INFO] Queue initialized with ID:", queue.id)
  // Set higher volume by default (adjust as needed)
  queue.setVolume(80)
})

client.language = config.language || "en"
const lang = require(`./languages/${config.language || "en"}.js`)

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return
    const event = require(`./events/${file}`)
    const eventName = file.split(".")[0]
    console.log(`${lang.loadclientevent}: ${eventName}`)
    client.on(eventName, event.bind(null, client))
    delete require.cache[require.resolve(`./events/${file}`)]
  })
})

fs.readdir("./events/player", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return
    const player_events = require(`./events/player/${file}`)
    const playerName = file.split(".")[0]
    console.log(`${lang.loadevent}: ${playerName}`)
    player.on(playerName, player_events.bind(null, client))
    delete require.cache[require.resolve(`./events/player/${file}`)]
  })
})

client.commands = []
fs.readdir(config.commandsDir, (err, files) => {
  if (err) throw err
  files.forEach(async (f) => {
    try {
      if (f.endsWith(".js")) {
        const props = require(`${config.commandsDir}/${f}`)
        client.commands.push({
          name: props.name,
          description: props.description,
          options: props.options,
        })
        console.log(`${lang.loadcmd}: ${props.name}`)
      }
    } catch (err) {
      console.log(err)
    }
  })
})

if (config.TOKEN || process.env.TOKEN) {
  client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
    console.log(lang.error1)
  })
} else {
  setTimeout(() => {
    console.log(lang.error2)
  }, 2000)
}

if (config.mongodbURL || process.env.MONGO) {
  const mongoose = require("mongoose")
  // Fix for the strictQuery deprecation warning
  mongoose.set("strictQuery", false)
  mongoose
    .connect(config.mongodbURL || process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log(`Connected MongoDB`)
    })
    .catch((err) => {
      console.log("\nMongoDB Error: " + err + "\n\n" + lang.error4)
    })
} else {
  console.log(lang.error4)
}

const express = require("express")
const app = express()
const https = require("https")
const querystring = require("querystring")
const mongoose = require("mongoose")

// URI redirect untuk aliran otentikasi
const authCallbackURI = "/callback"

let accessToken
let refreshToken

// Koneksi ke MongoDB
// Fix for the strictQuery deprecation warning
mongoose.set("strictQuery", false)
mongoose.connect(config.mongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// Skema MongoDB untuk menyimpan token akses dan penyegaran
const tokenSchema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
})

const Token = mongoose.model("Token", tokenSchema)

// Fungsi untuk pertukaran kode akses dengan token akses dan refresh token
function exchangeCodeForToken(code) {
  const client_id = config.spotify.clientId
  const client_secret = config.spotify.clientSecret
  const redirect_uri = config.spotify.redirectUri

  const postData = querystring.stringify({
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri,
  })

  const options = {
    hostname: "accounts.spotify.com",
    path: "/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  }

  return new Promise(async (resolve, reject) => {
    const request = https.request(options, async (response) => {
      let data = ""

      response.on("data", (chunk) => {
        data += chunk
      })

      response.on("end", async () => {
        const responseData = JSON.parse(data)
        if (response.statusCode === 200) {
          accessToken = responseData.access_token
          refreshToken = responseData.refresh_token
          console.log("Access Token:", accessToken)
          console.log("Refresh Token:", refreshToken)
          // Simpan token akses dan token penyegaran ke dalam database
          await saveTokens(accessToken, refreshToken)
          resolve(accessToken)
        } else {
          reject("Gagal dalam pertukaran kode akses dengan token akses.")
        }
      })
    })

    request.on("error", (error) => {
      reject("Kesalahan dalam pertukaran kode akses dengan token akses: " + error)
    })

    request.write(postData)
    request.end()
  })
}

// Fungsi untuk simpan token akses dan token penyegaran ke dalam MongoDB
async function saveTokens(accessToken, refreshToken) {
  const token = new Token({
    accessToken,
    refreshToken,
  })
  await token.save()
}

// Fungsi untuk memperbarui token akses menggunakan refresh token
async function refreshAccessToken() {
  const client_id = config.spotify.clientId
  const client_secret = config.spotify.clientSecret
  const redirect_uri = config.spotify.redirectUri

  const postData = querystring.stringify({
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirect_uri,
  })

  const options = {
    hostname: "accounts.spotify.com",
    path: "/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  }

  return new Promise(async (resolve, reject) => {
    const request = https.request(options, async (response) => {
      let data = ""

      response.on("data", (chunk) => {
        data += chunk
      })

      response.on("end", async () => {
        const responseData = JSON.parse(data)
        if (response.statusCode === 200) {
          accessToken = responseData.access_token
          console.log("Access Token (refreshed):", accessToken)
          // Simpan token akses yang diperbarui ke dalam database
          await updateAccessToken(accessToken)
          resolve(accessToken)
        } else {
          reject("Gagal dalam pembaruan token akses dengan refresh token.")
        }
      })
    })

    request.on("error", (error) => {
      reject("Kesalahan dalam pembaruan token akses dengan refresh token: " + error)
    })

    request.write(postData)
    request.end()
  })
}

// Fungsi untuk memperbarui token akses di database
async function updateAccessToken(newAccessToken) {
  await Token.updateOne({}, { accessToken: newAccessToken })
}

// Definisikan rute untuk URI redirect
app.get(authCallbackURI, async (req, res) => {
  const code = req.query.code // Ambil kode akses dari query parameter

  try {
    await exchangeCodeForToken(code)

    // Setelah pertukaran kode akses berhasil, jadwalkan pembaruan token
    setInterval(refreshAccessToken, 3600000) // Pembaruan setiap satu jam (dalam milidetik)

    res.send("Autentikasi berhasil. Anda dapat menutup jendela ini.")
  } catch (error) {
    console.error(error)
    res.status(500).send("Terjadi kesalahan saat mengautentikasi.")
  }
})

// Ekspor token akses agar dapat diimpor oleh file lain
module.exports = {
  getAccessToken: () => accessToken,
}

app.get("/", (request, response) => {
  response?.sendStatus(200)
})

// Replace the static app.listen with dynamic port selection
function startExpressServer(port) {
  return new Promise((resolve, reject) => {
    const server = app
      .listen(port)
      .on("listening", () => {
        // Log host and port information
        const address = server.address();
        const host = address.address === '::' ? 'localhost' : address.address;
        const port = address.port;
        console.log(`[EXPRESS] Server running at http://${host}:${port}`);
        console.log(`[EXPRESS] Spotify callback URL: ${config.spotify.redirectUri}`);
        resolve(server)
      })
      .on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`)
          reject(err)
        } else {
          reject(err)
        }
      })
  })
}

// Try to start server on PORT, if busy, try PORT+1, PORT+2, etc. up to PORT+10
async function attemptStartExpressServer() {
  const PORT = process.env.PORT || 3000
  for (let port = PORT; port < PORT + 10; port++) {
    try {
      const server = await startExpressServer(port)
      return server
    } catch (err) {
      if (port === PORT + 9 || err.code !== "EADDRINUSE") {
        console.error("Failed to start Express server:", err.message)
        // Don't terminate the bot just because the Express server couldn't start
        console.log("Continuing bot operation without Express server...")
        break
      }
    }
  }
}

// Start the Express server
attemptStartExpressServer()

// Add better error handling for the express server
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error)
})
