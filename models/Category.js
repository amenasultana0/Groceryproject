const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: 'fas fa-box', required: true },
  color: { type: String },
  items: [{ text: String }],
  lowStockThreshold: {
    type: Number,
    default: 20,
    min: 1
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // ✅ this line is important
});

module.exports = mongoose.model('Category', CategorySchema);