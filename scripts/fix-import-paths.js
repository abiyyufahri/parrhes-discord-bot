/**
 * fix-import-paths.js
 * Script untuk memperbaiki path import yang rusak setelah restrukturisasi
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Directory utama untuk command
const commandsDir = path.join(__dirname, '../src/commands');

// Fungsi untuk memperbaiki file command
function fixCommandFile(filePath) {
  console.log(`Fixing file: ${filePath}`);
  
  try {
    // Baca konten file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Perbaikan path import
    let newContent = content;
    
    // 1. Perbaiki import core
    newContent = newContent.replace(
      /const \{ dbService \} = require\(['"]\.\.\/services\/core['"]\);/g,
      'const { dbService } = require("../../services/core");'
    );
    
    // 2. Tambahkan import languageLoader jika perlu
    if (newContent.includes('require(`../languages/') && !newContent.includes('loadLanguage')) {
      newContent = newContent.replace(
        /const \{ dbService \} = require\("\.\.\/\.\.\/services\/core"\);/g,
        'const { dbService } = require("../../services/core");\nconst { loadLanguage } = require("../../utils/languageLoader");'
      );
    }
    
    // 3. Perbaiki cara pemuatan bahasa
    newContent = newContent.replace(
      /let lang = await .*\.findOne\({ guildID: interaction\.guild\.id \});\s*\n\s*lang = lang\?\.language \|\| client\.language;\s*\n\s*lang = require\(`\.\.\/languages\/.*\.js`\);/g,
      'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
    );
    
    // 4. Perbaiki import functions.js
    newContent = newContent.replace(
      /const errorNotifer = require\(['"]\.\.\/functions\.js['"]\);/g,
      'const errorNotifer = require("../../utils/functions.js");'
    );
    
    // 5. Perbaiki import config.js
    newContent = newContent.replace(
      /const config = require\(['"]\.\.\/config\.js['"]\);/g,
      'const config = require("../../config/bot");'
    );
    
    newContent = newContent.replace(
      /const config = require\(['"]\.\.\/config['"]\);/g,
      'const config = require("../../config/bot");'
    );
    
    // Hanya tulis jika ada perubahan
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing file ${filePath}:`, error);
    return false;
  }
}

// Fungsi untuk memproses direktori secara rekursif
function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let count = 0;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      count += processDirectory(fullPath);
    } else if (file.name.endsWith('.js')) {
      if (fixCommandFile(fullPath)) {
        count++;
      }
    }
  }
  
  return count;
}

// Main
console.log('Starting fix process for import paths...');
const fixedCount = processDirectory(commandsDir);
console.log(`Fixed ${fixedCount} command files`);

// Untuk memperbaiki file secara individual
if (process.argv.length > 2) {
  const specificFile = process.argv[2];
  const fullPath = path.join(process.cwd(), specificFile);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Fixing specific file: ${fullPath}`);
    const fixed = fixCommandFile(fullPath);
    console.log(`File ${fixed ? 'fixed' : 'unchanged'}: ${fullPath}`);
  } else {
    console.error(`File not found: ${fullPath}`);
  }
} 