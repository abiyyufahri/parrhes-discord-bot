/**
 * cleanup.js
 * Script untuk membersihkan file-file yang tidak digunakan lagi setelah refactoring
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const logger = require('../src/utils/logger');

const LOG_CATEGORY = 'Cleanup';

// Files yang akan dihapus
const filesToDelete = [
  'keep_alive.js',
  'widevine.wvd',
  'functions.js',
  'firebaseConfig.js',
  'start_v20.bat',
  // Tambahkan file lain yang perlu dihapus
];

/**
 * Menghapus file yang tidak digunakan
 */
async function cleanup() {
  logger.info(LOG_CATEGORY, 'Starting cleanup of unused files');
  
  for (const file of filesToDelete) {
    const filePath = path.join(process.cwd(), file);
    
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
        logger.info(LOG_CATEGORY, `Deleted: ${file}`);
      } else {
        logger.info(LOG_CATEGORY, `File not found: ${file}`);
      }
    } catch (error) {
      logger.error(LOG_CATEGORY, `Error deleting ${file}: ${error.message}`);
    }
  }
  
  logger.info(LOG_CATEGORY, 'Cleanup completed');
}

// Jalankan jika dipanggil langsung
if (require.main === module) {
  cleanup().catch(error => {
    logger.error(LOG_CATEGORY, `Cleanup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = cleanup; 