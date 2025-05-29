/**
 * repair-commands.js
 * Script untuk memperbaiki semua path import yang rusak di file command
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Logger sederhana
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function repairFile(filePath) {
  try {
    // Baca isi file
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 1. Perbaiki import services/core
    if (content.includes('require("../services/core")') || content.includes("require('../services/core')")) {
      content = content.replace(
        /require\(['"]\.\.\/services\/core['"]\)/g, 
        'require("../../services/core")'
      );
      modified = true;
    }
    
    // 2. Perbaiki import utils/languageLoader
    if (content.includes('require("../utils/languageLoader")') || content.includes("require('../utils/languageLoader')")) {
      content = content.replace(
        /require\(['"]\.\.\/utils\/languageLoader['"]\)/g, 
        'require("../../utils/languageLoader")'
      );
      modified = true;
    }
    
    // 3. Perbaiki import utils/functions.js
    if (content.includes('require("../functions.js")') || content.includes("require('../functions.js')")) {
      content = content.replace(
        /require\(['"]\.\.\/functions\.js['"]\)/g, 
        'require("../../utils/functions.js")'
      );
      modified = true;
    }
    
    // 4. Perbaiki cara pemuatan bahasa
    if (content.includes('require(`../languages/') || content.includes("require('../languages/") || content.includes('require("../languages/')) {
      // Tambahkan import loadLanguage jika belum ada
      if (!content.includes('loadLanguage')) {
        content = content.replace(
          /(const \{ dbService \} = require\(['"](\.\.\/)+services\/core['"]\);)/g,
          '$1\nconst { loadLanguage } = require("../../utils/languageLoader");'
        );
      }
      
      // Ganti cara pemuatan bahasa
      content = content.replace(
        /let lang = await .*\.findOne\({ guildID: interaction\.guild\.id \})[^;]*;[\s\n]*lang = lang\?\.language \|\| client\.language[^;]*;[\s\n]*lang = require\(`\.\.\/languages\/.*\.js`\);/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id }).catch(e => {});\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      );
      
      // Ganti cara pemuatan bahasa versi alternatif
      content = content.replace(
        /const guildData = await .*\.findOne\({ guildID: interaction\.guild\.id \})[^;]*;[\s\n]*(?:let )?lang = require\(`\.\.\/languages\/.*\.js`\);/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id }).catch(e => {});\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      );
      
      modified = true;
    }
    
    // 5. Perbaiki import config
    if (content.includes('require("../config")') || content.includes("require('../config')")) {
      content = content.replace(
        /require\(['"]\.\.\/config['"]\)/g, 
        'require("../../config/bot")'
      );
      modified = true;
    }
    
    // Simpan perubahan jika ada
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      log(`Berhasil memperbaiki: ${filePath}`);
      return true;
    } else {
      log(`Tidak ada perubahan: ${filePath}`);
      return false;
    }
  } catch (error) {
    log(`Error memperbaiki ${filePath}: ${error.message}`);
    return false;
  }
}

async function main() {
  log('Memulai proses perbaikan command...');
  
  // Dapatkan semua file command
  const commandFiles = glob.sync('src/commands/**/*.js');
  
  let fixedCount = 0;
  let errorCount = 0;
  
  // Proses setiap file
  for (const file of commandFiles) {
    try {
      const success = await repairFile(file);
      if (success) fixedCount++;
    } catch (error) {
      log(`Error memproses ${file}: ${error.message}`);
      errorCount++;
    }
  }
  
  log(`Proses selesai: ${fixedCount} file diperbaiki, ${errorCount} error`);
  
  // Jalankan bot jika diminta
  if (process.argv.includes('--run')) {
    log('Menjalankan bot...');
    try {
      const { stdout, stderr } = await exec('node index.js');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      log(`Error menjalankan bot: ${error.message}`);
    }
  }
}

// Jalankan script
main().catch(error => {
  log(`Error utama: ${error.message}`);
  process.exit(1);
}); 