/**
 * fix-all-commands.js
 * Script untuk memperbaiki semua file command sekaligus
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory utama untuk command
const commandsDir = path.join(__dirname, '../src/commands');

// Fungsi untuk memperbaiki file command secara manual
function fixCommandFile(filePath) {
  console.log(`Fixing file: ${filePath}`);
  
  try {
    // Baca konten file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Tambahkan import loadLanguage jika belum ada
    if (!content.includes('loadLanguage') && content.includes('dbService')) {
      content = content.replace(
        /const \{ dbService \} = require\(['"](\.\.\/)+services\/core['"]\);/,
        'const { dbService } = require("$1services/core");\nconst { loadLanguage } = require("$1utils/languageLoader");'
      );
    }
    
    // Perbaiki kode yang mengimpor bahasa dengan cara yang salah
    const patterns = [
      // Pattern 1: let lang = await dbService?.musicbot?.findOne({...}) ... lang = require(`../languages/${lang}.js`);
      [
        /let\s+lang\s*=\s*await\s+dbService\?\.musicbot\?\.findOne\(\{\s*guildID:\s*interaction\.guild\.id\s*\}\)[^;]*;[\s\n]*lang\s*=\s*lang\?\.language\s*\|\|\s*client\.language[^;]*;[\s\n]*lang\s*=\s*require\(`\.\.\/languages\/.*\.js`\);/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      ],
      
      // Pattern 2: const guildData = await dbService.musicbot.findOne({...}) ... lang = require(`../languages/${guildData?.language || defaultLang}.js`);
      [
        /const\s+guildData\s*=\s*await\s+dbService\.musicbot\.findOne\(\{\s*guildID:\s*interaction\.guild\.id\s*\}\)[^;]*;[\s\n]*lang\s*=\s*require\(`\.\.\/languages\/.*\.js`\);/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      ],
      
      // Pattern 3: Untuk blok try-catch lang
      [
        /try\s*\{\s*const\s+guildData\s*=\s*await\s+dbService\.musicbot\.findOne\(\{\s*guildID:\s*interaction\.guild\.id\s*\}\)[^;]*;[\s\n]*lang\s*=\s*require\(`\.\.\/languages\/.*\.js`\);[\s\n]*\}\s*catch\s*\(e\)\s*\{[\s\n]*\/\/\s*Fallback.*[\s\n]*lang\s*=\s*require\(`\.\.\/languages\/.*\.js`\);[\s\n]*[^}]*\}/g,
        'let dbLang = await dbService?.musicbot?.findOne({ guildID: interaction.guild.id });\n    const langCode = dbLang?.language || client.language;\n    const lang = loadLanguage(langCode);'
      ]
    ];
    
    // Aplikasikan semua pattern
    for (const [pattern, replacement] of patterns) {
      content = content.replace(pattern, replacement);
    }
    
    // Tulis kembali file
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
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
console.log('Starting fix process for all command files...');
const fixedCount = processDirectory(commandsDir);
console.log(`Fixed ${fixedCount} command files`);

// Restart bot jika berhasil
if (fixedCount > 0) {
  console.log('Restarting bot...');
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error restarting bot:', error);
  }
} 