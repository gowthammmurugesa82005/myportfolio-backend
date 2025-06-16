// Import necessary modules
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Define the port for the server

// ✅ Updated CORS setup to allow local + deployed frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-frontend-name.netlify.app', // ✅ Replace with your Netlify URL
  'https://your-frontend-name.vercel.app'   // ✅ Or your Vercel domain if used
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  }
}));

// Enable parsing of JSON request bodies
app.use(express.json());

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

let model; // Declare a variable to hold the Gemini model instance

// Asynchronously initialize the Gemini model
(async () => {
    try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini model initialized with gemini-1.5-flash');
    } catch (err) {
        console.error('❌ Failed to load Gemini model:', err.message);
        process.exit(1);
    }
})();

// Define a simple GET route for health check
app.get('/', (req, res) => {
    res.send('✅ Gemini server running!');
});

// Define a POST route to handle AI questions
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

// Start the Express server and listen on the defined port
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
