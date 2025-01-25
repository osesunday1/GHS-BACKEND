const mongoose = require('mongoose');




const productSchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['Perishable', 'Shelf-Stable'],
        required: true,
      },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0, 'Quantity cannot be less than 0'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be less than 0'],
    }
}, { 
    timestamps: true 
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;