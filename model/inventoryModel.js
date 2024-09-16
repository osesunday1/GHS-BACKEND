const mongoose = require('mongoose');




const inventorySchema = new mongoose.Schema({
    item: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true,
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

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;