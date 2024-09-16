const mongoose = require('mongoose');
const Inventory = require('./inventoryModel');

const consumptionSchema = new mongoose.Schema({
    guestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Guest',
        required: true,
    },
    items: [{
        inventoryItemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
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
consumptionSchema.pre('save', async function(next) {
    const consumption = this;
    let totalAmount = 0;

    for (const item of consumption.items) {
        const inventoryItem = await Inventory.findById(item.inventoryItemId);
        if (!inventoryItem) {
            return next(new Error('Inventory item not found'));
        }
        item.amount = item.quantity * inventoryItem.price;
        totalAmount += item.amount;
    }

    consumption.totalAmount = totalAmount;
    next();
});

const Consumption = mongoose.model('Consumption', consumptionSchema);

module.exports = Consumption;