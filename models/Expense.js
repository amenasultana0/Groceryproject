const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true // e.g., Rent, Utilities, Salaries, Supplies
  },
  amount: {
    type: Number,
    required: true
  },
  supplier: {
    type: String // optional, for Supplier Payments chart
  },
  dueDate: {
    type: Date // optional, for upcoming payments
  },
  paid: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Expense', expenseSchema);