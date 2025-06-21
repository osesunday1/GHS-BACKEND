const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({
name: { type: String, required: true },
  sku: { type: String, unique: true },
  category: {
    type: String,
    enum: ['alcoholic drinks', 'non-alcoholic drinks', 'beverages', 'food items', 'toiletries'],
    required: true,
  },
  supplier: String,
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 5 },
  marketPrice: { type: Number, required: true },  
  sellingPrice: { type: Number, required: true },
  price: Number,
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);