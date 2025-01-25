const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be less than 0'],
    },
    category: {
        type: String,
        enum: ['Maintenance', 'Subscription', 'Utilities', 'Salaries', 'Miscellaneous', 'Laundry'],
        required: [true, 'Category is required'],
    },
    date: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, { 
    timestamps: true 
});

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;