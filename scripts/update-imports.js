/**
 * update-imports.js
 * Script untuk memperbarui path import di semua file command
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const logger = require('../src/utils/logger');

const LOG_CATEGORY = 'UpdateImports';

/**
 * Daftar pattern penggantian
 * Format: [regex pattern, replacement]
 */
const replacements = [
  [/const db = require\(["']\.\.\/mongoDB["']\);/g, 'const { dbService } = require("../../services/core");'],
  [/const errorNotifer = require\(["']\.\.\/functions\.js["']\)/g, 'const errorNotifer = require("../../utils/functions.js")'],
  [/const \{ errorNotifer \} = require\(["']\.\.\/functions\.js["']\)/g, 'const errorNotifer = require("../../utils/functions.js")'],
  [/const config = require\(["']\.\.\/config\.js["']\)/g, 'const config = require("../../config/bot")'],
  [/const config = require\(["']\.\.\/config["']\)/g, 'const config = require("../../config/bot")'],
  [/require\(["']\.\.\/functions\.js["']\)/g, 'require("../../utils/functions.js")'],
  [/await db\?\.musicbot\?\.findOne/g, 'await dbService?.musicbot?.findOne'],
  [/await db\.musicbot\.findOne/g, 'await dbService.musicbot.findOne'],
  [/await db\.musicbot\.updateOne/g, 'await dbService.musicbot.updateOne'],
  [/await db\.playlist\.find/g, 'await dbService.playlist.find'],
  [/await db\.playlist\.findOne/g, 'await dbService.playlist.findOne'],
  [/await db\.playlist\.updateOne/g, 'await dbService.playlist.updateOne'],
  [/await db\.playlist\.deleteOne/g, 'await dbService.playlist.deleteOne'],
  [/await db\.playlist\.isPlaylistManageable/g, 'await dbService.playlist.isPlaylistManageable'],
  [/lang = require\(`\.\.\/languages\/.*\.js`\);/g, 'lang = loadLanguage(langCode);'],
  [/lang = require\(`\.\.\/\.\.\/languages\/.*\.js`\);/g, 'lang = loadLanguage(langCode);'],
  [/let lang = await .*\?\.findOne.*\n.*lang = lang\?\.language \|\| .*/g, 'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id })\n    const langCode = dbLang?.language || client.language;'],
  [/let lang = await .*\n.*lang = lang\?\.language \|\| .*/g, 'let dbLang = await dbService.musicbot.findOne({ guildID: interaction.guild.id })\n    const langCode = dbLang?.language || client.language;'],
];

/**
 * Memperbarui file dengan penggantian yang ditentukan
 * @param {string} filePath - Path file yang akan diperbarui
 * @returns {Promise<boolean>} - True jika ada perubahan
 */
async function updateFile(filePath) {
  try {
    // Baca file
    const content = await readFileAsync(filePath, 'utf8');
    
    // Aplikasikan semua penggantian
    let newContent = content;
    let changed = false;
    
    // Periksa jika perlu menambahkan import language loader
    if (newContent.includes('lang = require') || 
        newContent.includes('language || client.language') ||
        newContent.match(/lang = .*language.js/)) {
      if (!newContent.includes('loadLanguage')) {
        newContent = newContent.replace(
          /const \{ dbService \} = require\(['"](\.\.\/)+services\/core['"].*\);/,
          'const { dbService } = require("$1services/core");\nconst { loadLanguage } = require("$1utils/languageLoader");'
        );
        changed = true;
      }
    }
    
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(newContent)) {
        newContent = newContent.replace(pattern, replacement);
        changed = true;
      }
    }
    
    // Simpan file jika ada perubahan
    if (changed) {
      await writeFileAsync(filePath, newContent, 'utf8');
      logger.info(LOG_CATEGORY, `Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Memproses direktori secara rekursif
 * @param {string} dirPath - Path direktori yang akan diproses
 * @returns {Promise<number>} - Jumlah file yang diperbarui
 */
async function processDirectory(dirPath) {
  let updatedCount = 0;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Proses subdirektori
        updatedCount += await processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        // Proses file JS
        const updated = await updateFile(fullPath);
        if (updated) updatedCount++;
      }
    }
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error processing directory ${dirPath}: ${error.message}`);
  }
  
  return updatedCount;
}

/**
 * Fungsi utama
 */
async function main() {
  logger.info(LOG_CATEGORY, 'Starting import path update process');
  
  // Direktori yang akan diproses
  const directories = [
    path.join(process.cwd(), 'src/commands'),
    path.join(process.cwd(), 'src/events'),
    path.join(process.cwd(), 'src/middleware')
  ];
  
  let totalUpdated = 0;
  
  // Proses semua direktori
  for (const dir of directories) {
    logger.info(LOG_CATEGORY, `Processing directory: ${dir}`);
    const updated = await processDirectory(dir);
    totalUpdated += updated;
    logger.info(LOG_CATEGORY, `${updated} files updated in ${dir}`);
  }
  
  logger.info(LOG_CATEGORY, `Total files updated: ${totalUpdated}`);
}

// Jalankan jika dipanggil langsung
if (require.main === module) {
  main().catch(error => {
    logger.error(LOG_CATEGORY, `Update process failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = main; 