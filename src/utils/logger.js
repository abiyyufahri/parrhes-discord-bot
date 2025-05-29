/**
 * Logger utility
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Current log level (can be changed at runtime)
let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level
 * @param {number} level - Log level to set
 */
function setLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Format the log message with timestamp and category
 * @param {string} level - Log level name
 * @param {string} category - Log category
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
function formatLog(level, category, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] [${category}] ${message}`;
}

/**
 * Log a debug message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function debug(category, message) {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.log(formatLog('DEBUG', category, message));
  }
}

/**
 * Log an info message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function info(category, message) {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log(formatLog('INFO', category, message));
  }
}

/**
 * Log a warning message
 * @param {string} category - Log category
 * @param {string} message - Log message
 */
function warn(category, message) {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(formatLog('WARN', category, message));
  }
}

/**
 * Log an error message
 * @param {string} category - Log category
 * @param {string|Error} error - Error message or object
 */
function error(category, error) {
  if (currentLogLevel <= LogLevel.ERROR) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : error;
    console.error(formatLog('ERROR', category, message));
  }
}

/**
 * Log a critical message
 * @param {string} category - Log category
 * @param {string|Error} error - Error message or object
 */
function critical(category, error) {
  if (currentLogLevel <= LogLevel.CRITICAL) {
    const message = error instanceof Error ? `${error.message}\n${error.stack}` : error;
    console.error(formatLog('CRITICAL', category, message));
  }
}

module.exports = {
  LogLevel,
  setLogLevel,
  debug,
  info,
  warn,
  error,
  critical
};