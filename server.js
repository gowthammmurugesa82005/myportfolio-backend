// Import necessary modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS setup (no trailing slashes!)
const allowedOrigins = [
  'http://localhost:3000',
  'https://myportfolio-frontend-cda8d2fam-gowthams-projects-7cff2d38.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for this origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true
}));

// Enable parsing of JSON
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
let model;

(async () => {
  try {
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Gemini model initialized with gemini-1.5-flash');
  } catch (err) {
    console.error('❌ Failed to load Gemini model:', err.message);
    process.exit(1);
  }
})();

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Gemini server running!');
});

// Main AI route
app.post('/ask', async (req, res) => {
  const { question, pageContent } = req.body;

  if (!question || !pageContent) {
    return res.status(400).json({ error: '❌ Missing input: question or pageContent.' });
  }

  if (!model) {
    return res.status(500).json({ error: '❌ Gemini model is not initialized.' });
  }

  try {
    const prompt = `Portfolio content:\n${pageContent}\n\nQuestion: ${question}`;
    const result = await model.generateContent(prompt);
    const reply = result?.response?.text() || '⚠️ No response from Gemini.';
    res.json({ reply });
  } catch (error) {
    console.error('❌ Error during content generation:', error.message);
    res.status(500).json({ error: '❌ Gemini AI failed to respond.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
