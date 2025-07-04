const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows multiple null values
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  unitOfMeasurement: {
    type: String,
    default: 'pcs'
  },
  costPrice: {
    type: Number,
    default: 0
  },
  reorderThreshold: {
    type: Number,
    default: 0
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier'
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  barcode: {
  type: String,
  required: false,
  unique: true,
  index: true
},
deleted: {
  type: Boolean,
  default: false
},
lastRestocked: {
  type: Date,
  default: Date.now
},
isRestock: {
  type: Boolean,
  default: false
}
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);