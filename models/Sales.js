const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now },
  salePrice: { type: Number, required: true },
  costPrice: { type: Number }, // for profit calculations
  customerName: String,
  region: String,
});

module.exports = mongoose.model('Sale', salesSchema);