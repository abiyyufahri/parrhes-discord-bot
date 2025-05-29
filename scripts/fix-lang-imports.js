/**
 * fix-lang-imports.js
 * Script untuk memperbaiki import bahasa yang masih menggunakan path relatif
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const logger = require('../src/utils/logger');

const LOG_CATEGORY = 'FixLangImports';

async function updateFile(filePath) {
  try {
    // Baca file
    const content = await readFileAsync(filePath, 'utf8');
    
    // Pattern untuk mencari import bahasa yang perlu diperbaiki
    const langImportPattern = /lang = require\(`\.\.\/languages\/.*\.js`\);/g;
    
    // Periksa apakah file menggunakan import bahasa yang salah
    if (langImportPattern.test(content)) {
      logger.info(LOG_CATEGORY, `Fixing language import in: ${filePath}`);
      
      // Tambahkan import languageLoader jika belum ada
      let newContent = content;
      if (!newContent.includes('loadLanguage')) {
        newContent = newContent.replace(
          /const \{ dbService \} = require\(['"](\.\.\/)+services\/core['"].*\);/,
          'const { dbService } = require("$1services/core");\nconst { loadLanguage } = require("$1utils/languageLoader");'
        );
      }
      
      // Perbaiki kode yang memuat bahasa
      newContent = newContent.replace(
        /let lang = await .*\?\.findOne\({ guildID: interaction\.guild\.id }\);[\s\S]*?lang = require\(`\.\.\/languages\/.*\.js`\);/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      );
      
      // Simpan perubahan
      await writeFileAsync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

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

async function main() {
  logger.info(LOG_CATEGORY, 'Starting language import fix process');
  
  // Direktori yang akan diproses
  const directories = [
    path.join(process.cwd(), 'src/commands')
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