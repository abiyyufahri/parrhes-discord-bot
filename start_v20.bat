@echo off
echo ===================================
echo = Discord Music Bot - Node.js v20 =
echo ===================================
echo.

echo Menginstal dependensi yang diperlukan...
call npm install --no-fund --no-audit --force

echo.
echo Menjalankan bot Discord...
node index.js

pause