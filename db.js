/**
 * db.js - Compatibility layer
 * File ini mempertahankan kompatibilitas dengan kode lama yang masih menggunakan db.js
 */

// Import service
const { dbService } = require('./src/services/core');

// Export untuk backward compatibility
module.exports = dbService; 