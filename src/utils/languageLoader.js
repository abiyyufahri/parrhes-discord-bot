/**
 * Language loader utility
 * Helps with consistent loading of language files across the codebase
 */
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const LOG_CATEGORY = 'LanguageLoader';
const DEFAULT_LANGUAGE = 'en';

/**
 * Load a language file by language code
 * @param {string} langCode - Language code (e.g., 'en', 'id')
 * @returns {Object} Language strings
 */
function loadLanguage(langCode) {
  try {
    // Ensure we have a valid language code
    const safeCode = langCode || DEFAULT_LANGUAGE;
    
    // Construct absolute path to language file
    const langPath = path.join(process.cwd(), 'languages', `${safeCode}.js`);
    
    // Check if language file exists
    if (!fs.existsSync(langPath)) {
      logger.warn(LOG_CATEGORY, `Language file for "${safeCode}" not found, falling back to ${DEFAULT_LANGUAGE}`);
      return loadLanguage(DEFAULT_LANGUAGE);
    }
    
    // Load and return language file
    return require(langPath);
  } catch (error) {
    logger.error(LOG_CATEGORY, `Error loading language: ${error.message}`);
    
    // Fallback to English as last resort
    if (langCode !== DEFAULT_LANGUAGE) {
      logger.warn(LOG_CATEGORY, `Falling back to ${DEFAULT_LANGUAGE} due to error`);
      return loadLanguage(DEFAULT_LANGUAGE);
    }
    
    // If we can't even load English, return an emergency fallback object
    return {
      error: 'Language file could not be loaded'
    };
  }
}

module.exports = { loadLanguage }; 