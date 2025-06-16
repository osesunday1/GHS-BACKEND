const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  changeType: { 
    type: String, 
    enum: ['IN', 'OUT', 'ADJUST'], 
    required: true 
  },
  quantityChanged: { 
    type: Number, 
    required: true 
  },
  unitPrice: { type: Number },
  marketPrice: { type: Number },
  total: { type: Number },
  note: String,
  customerName: String,
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('StockLog', stockLogSchema);