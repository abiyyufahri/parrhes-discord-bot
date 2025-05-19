// mongoDB.js - Firebase Firestore adapter
// This file maintains the same API as the original MongoDB version
// but now simply redirects to db.js

const db = require('./db');

// Re-export db object
module.exports = db; 