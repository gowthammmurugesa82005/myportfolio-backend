// server.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Add your deployed frontend URL here (NO trailing slash)
const allowedOrigins = [
  'http://localhost:3000',
  'https://myportfolio-frontend-ie3av5bl7-gowthams-projects-7cff2d38.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  }
}));

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
let model;

// Initialize Gemini Model
(async () => {
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini model initialized with gemini-1.5-flash');
  } catch (err) {
    console.error('❌ Failed to load Gemini model:', err.message);
    process.exit(1);
  }
})();

// Health Check Route
app.get('/', (req, res) => {
  res.send('✅ Gemini server running!');
});

// AI Chat Route
app.post('/ask', async (req, res) => {
  const { question, pageContent } = req.body;

  if (!question || !pageContent) {
    return res.status(400).json({ error: '❌ Missing input content (question or pageContent).' });
  }

  if (!model) {
    console.error('❌ Gemini model not initialized.');
    return res.status(500).json({ error: '❌ Gemini AI model is not ready.' });
  }

  try {
    const prompt = `Portfolio content:\n${pageContent}\n\nQuestion: ${question}`;
    const result = await model.generateContent(prompt);
    const reply = result?.response?.text() || '⚠️ No response from Gemini.';
    res.json({ reply });
  } catch (error) {
    console.error('❌ Gemini Error during content generation:', error.message);
    res.status(500).json({ error: '❌ Gemini AI failed to respond.' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
