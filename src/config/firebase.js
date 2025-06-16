const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://nutigo-9e686.firebaseio.com"
});

const db = admin.firestore();

module.exports = {
  admin,
  db
}; 