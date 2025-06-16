// // src/api/controllers/chatbot/chatController.js

// const OpenAI = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, 
// });

// exports.chatWithAI = async (req, res) => {
//   try {
//     const { message } = req.body;

//     if (!message) {
//       return res.status(400).json({ error: "Message is required" });
//     }

//     const completion = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo", // model FREE
//       messages: [{ role: "user", content: message }],
//       max_tokens: 1000,
//       temperature: 0.7, // sáng tạo vừa phải
//     });

//     const reply = completion.choices[0].message.content.trim();

//     res.status(200).json({ reply });
//   } catch (error) {
//     console.error(
//       "Error in chatWithAI:",
//       error?.response?.data || error.message
//     );
//     res.status(500).json({ error: "Failed to generate AI reply" });
//   }
// };

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const response = await result.response;
    const aiReply = response.text(); 

    res.json({ reply: aiReply });
  } catch (error) {
    console.error(
      "Error in chatWithAI:",
      error.response?.data || error.message
    );
    res.status(500).json({
      error: "Failed to generate AI reply",
      details: error.response?.data || error.message,
    });
  }
};

module.exports = { chatWithAI };
