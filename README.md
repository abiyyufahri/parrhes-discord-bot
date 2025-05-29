# Parrhes Discord Bot

## Konfigurasi Keamanan

Untuk alasan keamanan, bot ini menggunakan variabel lingkungan untuk menyimpan informasi sensitif. Ikuti langkah-langkah berikut untuk menyiapkan bot dengan aman:

1. Buat file `.env` di direktori utama projek
2. Tambahkan informasi sensitif Anda ke file `.env` dengan format berikut:

```
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# Firebase Configuration
# Firestore credentials diatur dalam service-account.json

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3002/callback
```

3. Pastikan file `.env` dimasukkan dalam `.gitignore` untuk mencegah informasi sensitif masuk ke repositori.

## Konfigurasi Firebase

Bot ini menggunakan Firebase Firestore untuk penyimpanan data. Ikuti langkah-langkah ini untuk menyiapkan Firebase:

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Buat database Firestore di mode Production
3. Buat service account di Settings > Service accounts > Generate new private key
4. Simpan file JSON yang diunduh sebagai `service-account.json` di direktori utama projek
5. Pastikan `service-account.json` dimasukkan dalam `.gitignore`

## Penting: Keamanan Kredensial

Jangan pernah menyimpan kredensial atau token secara langsung dalam file kode. Selalu gunakan variabel lingkungan atau metode keamanan lainnya untuk mengelola informasi sensitif.

## Penggunaan

[Tambahkan instruksi penggunaan bot di sini]

## 🗂 Project Structure 

```
/parrhes-discord-bot/
│
├── src/                             # Kode sumber utama
│   ├── commands/                    # Command handler
│   │   ├── music/                   # Perintah terkait musik
│   │   ├── playlist/                # Perintah terkait playlist
│   │   ├── utility/                 # Perintah utilitas
│   │   └── admin/                   # Perintah admin/moderator
│   │
│   ├── events/                      # Event handler
│   │   ├── discord/                 # Event Discord
│   │   └── player/                  # Event player musik
│   │
│   ├── services/                    # Service logic
│   │   ├── music/                   # Layanan terkait musik
│   │   ├── playlist/                # Layanan playlist
│   │   └── core/                    # Layanan inti
│   │
│   ├── repositories/                # Data access layer
│   │   ├── firestore/               # Implementasi Firestore
│   │   └── mongodb/                 # Implementasi MongoDB (jika diperlukan)
│   │
│   ├── models/                      # Model data
│   │   ├── playlist.js
│   │   └── settings.js
│   │
│   ├── utils/                       # Helper dan utilitas
│   │   ├── format.js                # Format pesan & tanggal
│   │   ├── validators.js            # Validasi input
│   │   ├── logger.js                # System logger
│   │   └── constants.js             # Konstanta aplikasi
│   │
│   ├── middleware/                  # Middleware untuk commands
│   │   ├── permission.js
│   │   └── cooldown.js
│   │
│   └── config/                      # Konfigurasi
│       ├── database.js
│       ├── bot.js
│       └── player.js
│
├── languages/                       # File bahasa/terjemahan
│
├── assets/                          # Asset seperti ikon atau citra
│
├── scripts/                         # Script utilitas
│   ├── deploy-commands.js           # Deploy slash commands
│   └── backup.js                    # Backup database
│
├── .env.example                     # Template file environment
├── index.js                         # Entry point aplikasi
├── bot.js                           # Kode bot utama
├── .gitignore
├── package.json
└── README.md 