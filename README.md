# Parrhes Discord Bot

## Konfigurasi Keamanan

Untuk alasan keamanan, bot ini menggunakan variabel lingkungan untuk menyimpan informasi sensitif. Ikuti langkah-langkah berikut untuk menyiapkan bot dengan aman:

1. Buat file `.env` di direktori utama projek
2. Tambahkan informasi sensitif Anda ke file `.env` dengan format berikut:

```
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# MongoDB Configuration
MONGODB_URL=your_mongodb_connection_string_here

# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:3002/callback
```

3. Pastikan file `.env` dimasukkan dalam `.gitignore` untuk mencegah informasi sensitif masuk ke repositori.

## Penting: Keamanan Kredensial

Jangan pernah menyimpan kredensial atau token secara langsung dalam file kode. Selalu gunakan variabel lingkungan atau metode keamanan lainnya untuk mengelola informasi sensitif.

## Penggunaan

[Tambahkan instruksi penggunaan bot di sini] 