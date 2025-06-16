const { db } = require('../../config/firebase');
const admin = require('firebase-admin');

class ChatMessage {
  constructor(senderId, receiverId, content, timestamp = admin.firestore.Timestamp.now(), updatedAt = admin.firestore.Timestamp.now()) {
    this.senderId = senderId.toString();
    this.receiverId = receiverId.toString();
    this.content = content;
    this.timestamp = timestamp;
    this.updatedAt = updatedAt;
  }

  // Lưu tin nhắn vào Firestore
  async save() {
    try {
      const messageRef = await db.collection('messages').add({
        senderId: this.senderId,
        receiverId: this.receiverId,
        content: this.content,
        timestamp: this.timestamp,
        updatedAt: this.updatedAt
      });

      return messageRef.id;
    } catch (error) {
      throw new Error('Error saving message: ' + error.message);
    }
  }

  // Lấy lịch sử chat giữa hai người dùng
  static async getChatHistory(userId1, userId2) {
    try {
      const userId1Str = userId1.toString();
      const userId2Str = userId2.toString();

      const messages = await db.collection('messages')
        .where('senderId', 'in', [userId1Str, userId2Str])
        .where('receiverId', 'in', [userId1Str, userId2Str])
        .orderBy('timestamp', 'asc')
        .get();

      return messages.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate() 
      }));
    } catch (error) {
      throw new Error('Error getting chat history: ' + error.message);
    }
  }
}

module.exports = ChatMessage; 