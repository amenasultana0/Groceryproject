const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  color: { type: String, default: '#000000' },
  items: [
    {
      text: String,
      createdAt: { type: Date, default: Date.now },
      id: Number, // optional unique id for each item
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);