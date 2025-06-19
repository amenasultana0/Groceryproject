// Example: routes/suggestions.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.post('/gemini-suggestions', async (req, res) => {
  const { ingredients } = req.body;
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
      {
        contents: [
          {
            parts: [
              {
                text: `Suggest 3 recipes using these ingredients: ${ingredients.join(', ')}. Respond ONLY with a JSON array, no explanation, with each recipe having fields: name, ingredients, and instructions.`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        }
      }
    );
    const candidates = response.data?.candidates;
    let text = '';
    let recipes = [];
    if (candidates && candidates.length > 0) {
      text = candidates[0]?.content?.parts?.[0]?.text?.trim();
      console.log('Gemini raw response:', text);
      if (text) {
        // Remove code block markers if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        // Try to find a JSON array in the text
        const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            recipes = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // If parsing fails, just send the raw text as markdown
            return res.json({ markdown: text });
          }
        } else {
          // If no JSON found, send the raw text as markdown
          return res.json({ markdown: text });
        }
      }
    }

    if (recipes.length === 0) {
      return res.status(500).json({ error: 'No valid recipes found in Gemini response' });
    }

    res.json({ recipes });
  } catch (error) {
    console.error('Gemini API error:', error?.response?.data || error.message, error?.response?.status);
    res.status(500).json({ error: 'Failed to fetch suggestions', details: error?.response?.data || error.message });
  }
});

module.exports = router;