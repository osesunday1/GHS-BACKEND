const mongoose = require('mongoose');

const apartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Apartment name is required'],
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Apartment type is required'],
    enum: ['studio', 'one-bedroom', 'two-bedroom', 'penthouse', '2-bed', '1-bed'], // Example types
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  maxGuests: {
    type: Number,
    required: [true, 'Maximum number of guests is required']
  },
  images: {
    type: [String], // Array of image URLs or paths
  },
 
}, { timestamps: true });

const Apartment = mongoose.model('Apartment', apartmentSchema);

module.exports = Apartment;