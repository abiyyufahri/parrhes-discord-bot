# YTMusic API Integration untuk Bot Discord

## Pengenalan

Plugin ini mengintegrasikan YTMusic API dengan DisTube untuk meningkatkan hasil pencarian musik, khususnya untuk lagu-lagu Indonesia yang sering mengalami masalah "NO_RESULT" saat menggunakan @distube/ytsr.

## Fitur Utama

1. **Pencarian Lagu Indonesia yang Lebih Baik** - Mengatasi masalah "NO_RESULT" saat mencari lagu Indonesia seperti "cari pacar lagi", dll.
2. **Special Mappings** - Pemetaan khusus untuk lagu-lagu Indonesia yang sulit ditemukan dengan query sederhana
3. **Query Variations** - Mencoba berbagai variasi query untuk meningkatkan peluang menemukan hasil
4. **Integrasi Seamless** - Terintegrasi dengan mulus ke DisTube dan plugin YouTubenya

## File-file Penting

- **ytmusic-override.js** - Implementasi pengganti untuk @distube/ytsr yang menggunakan ytmusic-api
- **ytmusic-plugin.js** - Plugin untuk DisTube yang mengintegrasikan YouTube Music API
- **patch-distube.js** - Patch khusus untuk metode DisTube dan plugin YouTube-nya
- **start-with-ytmusic.js** - Script untuk memulai bot dengan YTMusic override
- **test-indonesia-songs.js** - Tool untuk menguji implementasi dengan lagu-lagu Indonesia

## Cara Menggunakan

### Metode 1: Menggunakan start-with-ytmusic.js (Direkomendasikan)

Ini adalah cara termudah untuk menggunakan semua fitur override:

```bash
node start-with-ytmusic.js
```

Script ini akan mengatur override untuk @distube/ytsr dan memulai bot.

### Metode 2: Import Dalam index.js

Untuk mengintegrasikan secara manual, tambahkan kode berikut di awal index.js:

```javascript
// Setup module override untuk @distube/ytsr
const Module = require('module');
const path = require('path');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === '@distube/ytsr') {
    console.log('[OVERRIDE] Replacing @distube/ytsr with ytmusic-override');
    return originalRequire.call(this, './ytmusic-override.js');
  }
  return originalRequire.apply(this, arguments);
};

// Pre-load untuk inisialisasi
require('./ytmusic-override');
```

### Metode 3: Menggunakan YouTubeMusicPlugin Saja

Gunakan plugin tanpa override module system:

```javascript
const { DisTube } = require('distube');
const YouTubeMusicPlugin = require('./ytmusic-plugin');

const distube = new DisTube(client, {
  plugins: [
    new YouTubeMusicPlugin(),
    // other plugins...
  ]
});
```

### Metode 4: Patching DisTube Langsung

Import dan gunakan fungsi patch:

```javascript
const { patchDistube } = require('./patch-distube');
const distube = new DisTube(client, { /* options */ });

// Patch DisTube setelah inisialisasi
patchDistube(distube);
```

## Pengujian

Untuk menguji implementasi dengan lagu-lagu Indonesia:

```bash
node test-indonesia-songs.js
```

Script ini akan menguji beberapa lagu Indonesia yang sebelumnya bermasalah dan menunjukkan hasil dari tiga metode pencarian yang berbeda.

## Special Mappings

Implementasi menyertakan daftar pemetaan khusus untuk lagu-lagu Indonesia populer yang sering sulit ditemukan dengan hanya judul singkatnya, termasuk:

- cari pacar lagi → ST12 cari pacar lagi
- kangen → dewa 19 kangen
- jodoh → wali cari jodoh
- maafkanlah → maafkanlah reza re
- ayah → seventeen ayah
- dan banyak lagi

## Troubleshooting

Jika masih mendapatkan kesalahan "NO_RESULT":

1. Pastikan ytmusic-api sudah terinisialisasi dengan benar
2. Coba tambahkan mapping baru di ytmusic-override.js dan ytmusic-plugin.js
3. Gunakan kombinasi metode patch dan plugin untuk hasil maksimal
4. Pastikan koneksi internet stabil karena API YouTube Music memerlukan koneksi yang baik

## Dependensi

- ytmusic-api: ^5.3.0 atau lebih baru
- distube: ^5.0.0 atau lebih baru
- discord.js: ^14.0.0 atau lebih baru

## Kredit

Solusi ini dikembangkan untuk mengatasi masalah pencarian lagu Indonesia dalam bot Discord yang menggunakan DisTube. 