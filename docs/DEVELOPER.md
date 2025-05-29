# Panduan Developer - Parrhesia Discord Bot

Dokumen ini menyediakan informasi untuk pengembang yang ingin mengembangkan atau memodifikasi Parrhesia Discord Bot.

## Struktur Project

Project menggunakan struktur modular untuk memudahkan maintenance dan pengembangan:

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
│   │   └── mongodb/                 # Implementasi MongoDB
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
```

## Alur Kerja Pengembangan

### 1. Setup Lingkungan Development

1. Clone repository dari GitHub
2. Instal dependensi: `npm install`
3. Salin `.env.example` menjadi `.env` dan sesuaikan konfigurasi

### 2. Menambahkan Command Baru

Untuk menambahkan command baru, ikuti langkah-langkah berikut:

1. Buat file JavaScript baru di direktori yang sesuai dalam `src/commands/`
2. Gunakan struktur berikut sebagai template:

```js
const { ApplicationCommandOptionType } = require("discord.js");
const logger = require('../../utils/logger');

const LOG_CATEGORY = 'CommandNama';

module.exports = {
  name: "nama-command",
  description: "Deskripsi command",
  options: [
    // Definisikan opsi command di sini
  ],
  permissions: "0x0000000000000800", // Izin yang diperlukan
  run: async (client, interaction) => {
    try {
      // Implementasi command
      
    } catch (error) {
      logger.error(LOG_CATEGORY, error);
      // Handle error
    }
  },
};
```

### 3. Menambahkan Event Handler

Untuk menambahkan event handler baru:

1. Buat file JavaScript baru di direktori yang sesuai dalam `src/events/`
2. Gunakan struktur berikut:

```js
const logger = require('../../utils/logger');

const LOG_CATEGORY = 'EventNama';

module.exports = async (client, ...args) => {
  try {
    // Implementasi event handler
    
  } catch (error) {
    logger.error(LOG_CATEGORY, error);
  }
};
```

### 4. Menggunakan Service Layer

Service layer menyediakan logika bisnis yang dapat digunakan kembali:

```js
const playlistService = require('../../services/playlist/playlistService');

// Dalam command handler
const playlist = await playlistService.getUserPlaylists(userId);
```

### 5. Menggunakan Repository Layer

Repository layer menangani akses data:

```js
const playlistRepository = require('../../repositories/firestore/playlistRepository');

// Dalam service
const playlist = await playlistRepository.findByUserId(userId);
```

### 6. Logger

Logger tersedia untuk melacak aktivitas dan error:

```js
const logger = require('../../utils/logger');

logger.info('Category', 'Informational message');
logger.error('Category', 'Error message or error object');
```

## Best Practices

1. **Separation of Concerns**: Pisahkan logika bisnis, akses data, dan presentasi
2. **Error Handling**: Selalu tangani error dengan logger yang tepat
3. **Dokumentasi**: Tambahkan JSDoc untuk fungsi dan kelas
4. **Validasi Input**: Validasi input user sebelum diproses
5. **Testing**: Tulis test untuk fitur kunci

## Deployment

Bot bisa di-deploy dengan cara:

1. Setup environment di server hosting
2. Instal dependensi: `npm install --production`
3. Jalankan bot: `npm start` atau gunakan process manager seperti PM2: `pm2 start index.js --name "parrhes-bot"`

## Troubleshooting

Jika mengalami masalah:

1. Periksa log untuk error
2. Verifikasi konfigurasi di `.env`
3. Pastikan izin bot di server Discord sudah benar
4. Cek koneksi ke Firestore/database

## Kontribusi

Untuk berkontribusi pada proyek:

1. Fork repository
2. Buat branch fitur: `git checkout -b fitur-baru`
3. Commit perubahan: `git commit -m 'Menambahkan fitur baru'`
4. Push ke branch: `git push origin fitur-baru`
5. Submit pull request 