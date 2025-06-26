const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, default: 1 },
  price: { type: Number, default: 0 },
  priority: { type: String, default: 'medium' },
  notes: { type: String, default: '' },
  purchased: { type: Boolean, default: false },
  source: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);