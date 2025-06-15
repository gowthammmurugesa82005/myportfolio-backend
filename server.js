// Import necessary modules
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000; // Define the port for the server

// Middleware setup
// Enable CORS for cross-origin requests, specifically from your frontend at localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));
// Enable parsing of JSON request bodies
app.use(express.json());

// Initialize GoogleGenerativeAI with your API key
// Ensure GOOGLE_API_KEY is set in your .env file
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

let model; // Declare a variable to hold the Gemini model instance

// Asynchronously initialize the Gemini model
// Using gemini-1.5-flash as it's a common and available model for text generation.
// This resolves the 404 error often encountered with 'gemini-pro' in certain API versions.
(async () => {
    try {
        // Get the generative model instance. Ensure the model name is correct and available.
        // 'gemini-1.5-flash' is a good general-purpose text generation model.
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Gemini model initialized with gemini-1.5-flash');
    } catch (err) {
        // Log any errors encountered during model initialization
        console.error('❌ Failed to load Gemini model:', err.message);
        // It's good practice to exit if the model can't be initialized,
        // as subsequent API calls will fail anyway.
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

    // Validate request body
    if (!question || !pageContent) {
        return res.status(400).json({ error: '❌ Missing input content (question or pageContent).' });
    }

    // Ensure the model is initialized before attempting to use it
    if (!model) {
        console.error('❌ Gemini model not initialized.');
        return res.status(500).json({ error: '❌ Gemini AI model is not ready.' });
    }

    try {
        // Construct the prompt for the Gemini model
        const prompt = `Portfolio content:\n${pageContent}\n\nQuestion: ${question}`;

        // Generate content using the Gemini model
        const result = await model.generateContent(prompt); // Simplified call for direct string prompt

        // Extract the reply from the model's response
        // Accessing response data safely using optional chaining
        const reply = result?.response?.text() || '⚠️ No response from Gemini.';

        // Send the AI's reply back to the client
        res.json({ reply });
    } catch (error) {
        // Log and send back any errors during the AI generation process
        console.error('❌ Gemini Error during content generation:', error.message);
        res.status(500).json({ error: '❌ Gemini AI failed to respond.' });
    }
});

// Start the Express server and listen on the defined port
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});