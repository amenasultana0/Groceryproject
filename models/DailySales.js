const mongoose = require('mongoose');

const DailySalesSchema = new mongoose.Schema({
  date: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sales: { type: Number, default: 0 },
  orders: { type: Number, default: 0 }
});

module.exports = mongoose.model('DailySales', DailySalesSchema);