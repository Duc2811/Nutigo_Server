const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chatbox/chatController');
const { Authorization } = require('../../../middleware/user.middleware');

router.post('/send', Authorization, chatController.sendMessage);
router.get('/history/:otherUserId', Authorization, chatController.getChatHistory);
router.delete('/delete/:messageId', Authorization, chatController.deleteMessage);
router.put('/update/:messageId', Authorization, chatController.updateMessage);
router.get('/users', Authorization, chatController.getChatUsers);
router.get('/receiver/:receiverId', Authorization, chatController.getReceiverUser);

module.exports = router; 