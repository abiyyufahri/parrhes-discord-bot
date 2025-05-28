// Firebase Configuration
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Firebase web config
const firebaseConfig = {
  apiKey: "AIzaSyA-3al0FOtffJwNSkUoNYfaT6YQ28ZyarI",
  authDomain: "heroic-venture-391412.firebaseapp.com",
  projectId: "heroic-venture-391412",
  storageBucket: "heroic-venture-391412.firebasestorage.app",
  messagingSenderId: "655196610308",
  appId: "1:655196610308:web:a508110b385ca8e39c7a51",
  measurementId: "G-CHDRYYZ83K"
};

// Initialize Firebase client SDK
const clientApp = initializeApp(firebaseConfig);
const firestoreClient = getFirestore(clientApp);

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account.json');
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const firestoreAdmin = admin.firestore();

module.exports = {
  admin,
  firestoreAdmin,
  firestoreClient
}; 