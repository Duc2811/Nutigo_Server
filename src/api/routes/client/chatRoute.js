const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../../controllers/chatbot/chatController");

router.post("/chat", chatWithAI);

module.exports = router;
