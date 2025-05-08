const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bot is running.');
});

function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port)
      .on('listening', () => {
        console.log(`Server is running on port ${port}`);
        resolve(server);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is busy, trying port ${port + 1}...`);
          reject(err);
        } else {
          reject(err);
        }
      });
  });
}

// Try to start server on PORT, if busy, try PORT+1, PORT+2, etc. up to PORT+10
async function attemptStartServer() {
  for (let port = PORT; port < PORT + 10; port++) {
    try {
      const server = await startServer(port);
      return server;
    } catch (err) {
      if (port === PORT + 9 || err.code !== 'EADDRINUSE') {
        console.error('Failed to start server:', err.message);
        // Don't terminate the bot just because the web server couldn't start
        console.log('Continuing bot operation without web server...');
        break;
      }
    }
  }
}

// Start the server but don't block the module export
attemptStartServer();

module.exports = app;
