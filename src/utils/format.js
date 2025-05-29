/**
 * Utility functions for formatting
 */

/**
 * Format duration in seconds to hh:mm:ss format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Get icon for music source
 * @param {string} source - Music source name
 * @returns {string} Emoji representing the source
 */
function getSourceIcon(source) {
  switch(source && source.toLowerCase()) {
    case 'spotify':
      return '🟢';
    case 'youtube':
    case 'youtube-music':
      return '🔴';
    case 'soundcloud':
      return '🟠';
    case 'custom':
      return '🎵';
    default:
      return '🎧';
  }
}

module.exports = {
  formatDuration,
  getSourceIcon
};