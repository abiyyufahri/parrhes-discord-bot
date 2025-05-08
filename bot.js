const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { DisTube } = require("distube");
const { SpotifyPlugin } = require("@distube/spotify");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { DeezerPlugin } = require("@distube/deezer");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const config = require("./config.js");
const fs = require("fs");

// Load opusscript for Node.js v20 compatibility
require('opusscript');

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
});

client.config = config;
client.player = new DisTube(client, {
  leaveOnStop: config.opt.voiceConfig.leaveOnStop,
  leaveOnFinish: config.opt.voiceConfig.leaveOnFinish,
  leaveOnEmpty: config.opt.voiceConfig.leaveOnEmpty.status,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
    new DeezerPlugin(),
  ],
  // Explicitly set ytdlOptions for better compatibility with Node.js v20
  ytdlOptions: {
    highWaterMark: 1 << 24,
    quality: 'highestaudio'
  }
});

const player = client.player;
client.language = config.language || "en";
let lang = require(`./languages/${config.language || "en"}.js`);

fs.readdir("./events", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    console.log(`${lang.loadclientevent}: ${eventName}`);
    client.on(eventName, event.bind(null, client));
    delete require.cache[require.resolve(`./events/${file}`)];
  });
});

fs.readdir("./events/player", (_err, files) => {
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const player_events = require(`./events/player/${file}`);
    let playerName = file.split(".")[0];
    console.log(`${lang.loadevent}: ${playerName}`);
    player.on(playerName, player_events.bind(null, client));
    delete require.cache[require.resolve(`./events/player/${file}`)];
  });
});

client.commands = [];
fs.readdir(config.commandsDir, (err, files) => {
  if (err) throw err;
  files.forEach(async (f) => {
    try {
      if (f.endsWith(".js")) {
        let props = require(`${config.commandsDir}/${f}`);
        client.commands.push({
          name: props.name,
          description: props.description,
          options: props.options,
        });
        console.log(`${lang.loadcmd}: ${props.name}`);
      }
    } catch (err) {
      console.log(err);
    }
  });
});

if (config.TOKEN || process.env.TOKEN) {
  client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
    console.log(lang.error1);
  });
} else {
  setTimeout(() => {
    console.log(lang.error2);
  }, 2000);
}

if (config.mongodbURL || process.env.MONGO) {
  const mongoose = require("mongoose");
  // Fix for the strictQuery deprecation warning
  mongoose.set('strictQuery', false);
  mongoose
    .connect(config.mongodbURL || process.env.MONGO, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      console.log(`Connected MongoDB`);
    })
    .catch((err) => {
      console.log("\nMongoDB Error: " + err + "\n\n" + lang.error4);
    });
} else {
  console.log(lang.error4);
}

const express = require("express");
const app = express();
const https = require("https");
const querystring = require("querystring");
const mongoose = require("mongoose");

// URI redirect untuk aliran otentikasi
const authCallbackURI = "/callback";

let accessToken;
let refreshToken;

// Koneksi ke MongoDB
// Fix for the strictQuery deprecation warning
mongoose.set('strictQuery', false);
mongoose.connect(config.mongodbURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Skema MongoDB untuk menyimpan token akses dan penyegaran
const tokenSchema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
});

const Token = mongoose.model("Token", tokenSchema);

// Fungsi untuk pertukaran kode akses dengan token akses dan refresh token
function exchangeCodeForToken(code) {
  const client_id = config.spotify.clientId;
  const client_secret = config.spotify.clientSecret;
  const redirect_uri = "https://parrhesbot.abiyyurahid20.repl.co/callback";

  const postData = querystring.stringify({
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: redirect_uri,
  });

  const options = {
    hostname: "accounts.spotify.com",
    path: "/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  return new Promise(async (resolve, reject) => {
    const request = https.request(options, async (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", async () => {
        const responseData = JSON.parse(data);
        if (response.statusCode === 200) {
          accessToken = responseData.access_token;
          refreshToken = responseData.refresh_token;
          console.log("Access Token:", accessToken);
          console.log("Refresh Token:", refreshToken);
          // Simpan token akses dan token penyegaran ke dalam database
          await saveTokens(accessToken, refreshToken);
          resolve(accessToken);
        } else {
          reject("Gagal dalam pertukaran kode akses dengan token akses.");
        }
      });
    });

    request.on("error", (error) => {
      reject(
        "Kesalahan dalam pertukaran kode akses dengan token akses: " + error
      );
    });

    request.write(postData);
    request.end();
  });
}

// Fungsi untuk simpan token akses dan token penyegaran ke dalam MongoDB
async function saveTokens(accessToken, refreshToken) {
  const token = new Token({
    accessToken,
    refreshToken,
  });
  await token.save();
}

// Fungsi untuk memperbarui token akses menggunakan refresh token
async function refreshAccessToken() {
  const client_id = config.spotify.clientId;
  const client_secret = config.spotify.clientSecret;
  const redirect_uri = "https://parrhesbot.abiyyurahid20.repl.co/callback";

  const postData = querystring.stringify({
    client_id: client_id,
    client_secret: client_secret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    redirect_uri: redirect_uri,
  });

  const options = {
    hostname: "accounts.spotify.com",
    path: "/api/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  return new Promise(async (resolve, reject) => {
    const request = https.request(options, async (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", async () => {
        const responseData = JSON.parse(data);
        if (response.statusCode === 200) {
          accessToken = responseData.access_token;
          console.log("Access Token (refreshed):", accessToken);
          // Simpan token akses yang diperbarui ke dalam database
          await updateAccessToken(accessToken);
          resolve(accessToken);
        } else {
          reject("Gagal dalam pembaruan token akses dengan refresh token.");
        }
      });
    });

    request.on("error", (error) => {
      reject(
        "Kesalahan dalam pembaruan token akses dengan refresh token: " + error
      );
    });

    request.write(postData);
    request.end();
  });
}

// Fungsi untuk memperbarui token akses di database
async function updateAccessToken(newAccessToken) {
  await Token.updateOne({}, { accessToken: newAccessToken });
}

// Definisikan rute untuk URI redirect
app.get(authCallbackURI, async (req, res) => {
  const code = req.query.code; // Ambil kode akses dari query parameter

  try {
    await exchangeCodeForToken(code);

    // Setelah pertukaran kode akses berhasil, jadwalkan pembaruan token
    setInterval(refreshAccessToken, 3600000); // Pembaruan setiap satu jam (dalam milidetik)

    res.send("Autentikasi berhasil. Anda dapat menutup jendela ini.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan saat mengautentikasi.");
  }
});


// Ekspor token akses agar dapat diimpor oleh file lain
module.exports = {
  getAccessToken: () => accessToken,
};

app.get("/", (request, response) => {
  response?.sendStatus(200);
});

// Replace the static app.listen with dynamic port selection
function startExpressServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .on('listening', () => {
        console.log(`Express server is running on port ${port}`);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`);
          reject(err);
        } else {
          reject(err);
        }
      });
  });
}

// Try to start server on PORT, if busy, try PORT+1, PORT+2, etc. up to PORT+10
async function attemptStartExpressServer() {
  const PORT = process.env.PORT || 3000;
  for (let port = PORT; port < PORT + 10; port++) {
    try {
      const server = await startExpressServer(port);
      return server;
    } catch (err) {
      if (port === PORT + 9 || err.code !== 'EADDRINUSE') {
        console.error('Failed to start Express server:', err.message);
        // Don't terminate the bot just because the Express server couldn't start
        console.log('Continuing bot operation without Express server...');
        break;
      }
    }
  }
}

// Start the Express server
attemptStartExpressServer();
