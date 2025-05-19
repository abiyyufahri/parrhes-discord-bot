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