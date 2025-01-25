const mongoose = require('mongoose');
const Product = require('./productModel');

const inventorySchema = new mongoose.Schema({
    guestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true,
    },
    items: [{
        productItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity must be at least 1'],
        },
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount cannot be less than 0'],
        },
    }],
    totalAmount: {
        type: Number,
        required: true,
        min: [0, 'Total amount cannot be less than 0'],
        default: 0,
    }
}, { 
    timestamps: true 
});

// Pre-save hook to calculate the amount for each item and total amount
inventorySchema.pre('save', async function(next) {
    const inventory = this;
    let totalAmount = 0;

    for (const item of inventory.items) {
        const productItem = await Product.findById(item.productItemId);
        if (!productItem) {
            return next(new Error('product item not found'));
        }
        item.amount = item.quantity * productItem.price;
        totalAmount += item.amount;
    }

    inventory.totalAmount = totalAmount;
    next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;