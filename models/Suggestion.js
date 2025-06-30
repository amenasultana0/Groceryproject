// models/Suggestion.js
const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['performance', 'strategy', 'optimization', 'seasonal', 'custom'],
    default: 'custom'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Suggestion', suggestionSchema);