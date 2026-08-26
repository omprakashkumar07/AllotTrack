require('dotenv/config');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'missing-key' 
});

const prompt = `Search the web for one currently OPEN mainboard IPO in India right now. 
      Respond with ONLY a valid JSON array, no markdown formatting, no extra text.
      [{
        "name": "string",
        "category": "mainboard"
      }]`;

ai.models.generateContent({
  model: 'gemini-3.6-flash',
  contents: prompt,
  config: {
    tools: [{ googleSearch: {} }],
  },
}).then(r => console.log(r.text)).catch(console.error);
