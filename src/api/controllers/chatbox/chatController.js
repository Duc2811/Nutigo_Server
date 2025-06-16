const ChatMessage = require('../../models/chatMessage');
const { db } = require('../../../config/firebase');
const Users = require('../../models/user');

// Gửi tin nhắn mới
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id; // Lấy ID người gửi từ middleware

    console.log('Sending message:', {
      senderId,
      receiverId,
      content
    });

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const message = new ChatMessage(senderId, receiverId, content);
    const messageId = await message.save();

    console.log('Message saved with ID:', messageId);

    res.status(201).json({
      message: 'Message sent successfully',
      messageId
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Lấy lịch sử chat giữa hai người dùng
exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id; // Lấy ID người dùng hiện tại từ middleware
    const { otherUserId } = req.params; // ID của người dùng khác

    if (!otherUserId) {
      return res.status(400).json({ message: 'Missing other user ID' });
    }

    // Lấy tất cả tin nhắn giữa hai người dùng
    const messages = await db.collection('messages')
      .where('senderId', 'in', [currentUserId.toString(), otherUserId])
      .where('receiverId', 'in', [currentUserId.toString(), otherUserId])
      .get();

    // Chuyển đổi tin nhắn thành mảng và sắp xếp theo thời gian
    const chatHistory = messages.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
      isCurrentUser: doc.data().senderId === currentUserId.toString() // Thêm flag để biết tin nhắn của ai
    }));

    // Sắp xếp tin nhắn theo thời gian giảm dần
    chatHistory.sort((a, b) => b.timestamp - a.timestamp);

    res.status(200).json(chatHistory);
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    res.status(500).json({
      message: 'Error getting chat history',
      error: error.message
    });
  }
};

// Xóa tin nhắn
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user._id;

    // Lấy tin nhắn để kiểm tra quyền xóa
    const messageDoc = await db.collection('messages').doc(messageId).get();

    if (!messageDoc.exists) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = messageDoc.data();

    // Kiểm tra xem người dùng hiện tại có phải là người gửi không
    if (message.senderId !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Xóa tin nhắn
    await db.collection('messages').doc(messageId).delete();

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting message',
      error: error.message
    });
  }
};
exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Lấy tin nhắn để kiểm tra quyền cập nhật
    const messageRef = db.collection('messages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const message = messageDoc.data();
    
    // Kiểm tra xem người dùng hiện tại có phải là người gửi không
    if (message.senderId !== currentUserId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this message' });
    }

    // Cập nhật tin nhắn
    await messageRef.update({
      content,
      updatedAt: new Date()
    });

    res.status(200).json({ 
      message: 'Message updated successfully',
      updatedMessage: {
        id: messageId,
        content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        timestamp: message.timestamp,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error in updateMessage:', error);
    res.status(500).json({
      message: 'Error updating message',
      error: error.message
    });
  }
};

// Lấy danh sách người dùng đã chat với current user
exports.getChatUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();
    console.log('Current User ID:', currentUserId);

    // Lấy tất cả tin nhắn có liên quan đến current user
    const messages = await db.collection('messages')
      .where('senderId', '==', currentUserId)
      .get();

    const receivedMessages = await db.collection('messages')
      .where('receiverId', '==', currentUserId)
      .get();

    console.log('Sent messages count:', messages.size);
    console.log('Received messages count:', receivedMessages.size);

    // Tạo Set để lưu trữ unique user IDs
    const uniqueUserIds = new Set();

    // Thêm tất cả receiverId từ tin nhắn đã gửi
    messages.docs.forEach(doc => {
      const data = doc.data();
      console.log('Sent message receiverId:', data.receiverId);
      if (data.receiverId) {
        uniqueUserIds.add(data.receiverId);
      }
    });

    // Thêm tất cả senderId từ tin nhắn đã nhận
    receivedMessages.docs.forEach(doc => {
      const data = doc.data();
      console.log('Received message senderId:', data.senderId);
      if (data.senderId) {
        uniqueUserIds.add(data.senderId);
      }
    });

    console.log('Unique user IDs:', Array.from(uniqueUserIds));

    // Chuyển Set thành mảng
    const userIds = Array.from(uniqueUserIds);

    // Lấy thông tin chi tiết của từng user từ MongoDB
    const users = await Users.find(
      { _id: { $in: userIds } },
      { password: 0, token: 0, deletedAt: 0 } // Loại bỏ các trường nhạy cảm
    ).lean();

    const formattedUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.userName || 'Unknown User',
      email: user.email || '',
      avatar: user.avatar || '',
      role: user.role
    }));

    console.log('Final formatted users:', formattedUsers);

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error in getChatUsers:', error);
    res.status(500).json({
      message: 'Error getting chat users',
      error: error.message
    });
  }
};

// Lấy thông tin người nhận tin nhắn
exports.getReceiverUser = async (req, res) => {
  try {
    const { receiverId } = req.params;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Lấy thông tin user từ MongoDB
    const user = await Users.findOne(
      { _id: receiverId },
      { password: 0, token: 0, deletedAt: 0 } // Loại bỏ các trường nhạy cảm
    ).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format lại dữ liệu user
    const formattedUser = {
      _id: user._id.toString(),
      name: user.userName || 'Unknown User',
      email: user.email || '',
      avatar: user.avatar || '',
      role: user.role
    };

    res.status(200).json(formattedUser);
  } catch (error) {
    console.error('Error in getReceiverUser:', error);
    res.status(500).json({
      message: 'Error getting receiver user',
      error: error.message
    });
  }
};
