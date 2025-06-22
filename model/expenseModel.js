const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    enum: [
      'Electricity',
      'Laundry',
      'Internet',
      'DSTV',
      'Fuel',
      'Delivery Fee',
      'Rent',
      'Salary',
      'Maintenance',
      'Gas',
      'Cleaning',
      'Miscellaneous'
    ],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['utilities', 'logistics', 'salary','rent', 'maintenance', 'cleaning', 'miscellaneous'],
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank transfer', 'POS', 'mobile payment'],
    default: 'cash',
  },
  paidTo: {
    type: String,
    enum: [
      'Landlord',
      'NEPA',
      'Internet Provider',
      'Employee',
      'Supplier',
      'Mechanic',
      'Cleaner',
      'Other'
    ],
    default: 'Other',
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);