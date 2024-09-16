const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
    required: true
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required']
  },
  checkOutDate: {
    type: Date,
    required: [true, 'Check-out date is required'],
    validate: {
      validator: function(value) {
        return value > this.checkInDate;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  apartmentName: {
    type: String,
    required: true
  },
  numberOfRooms: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price']
  },
  amountPaid: {
    type: Number,
    required: [true, 'Amount paid by the guest is required'],
    default: 0
  },
  cautionFee: {
    type: Number,
    required: [true, 'Caution fee is required'],
    default: 0
  }
});

// Virtual property for calculating the number of days
bookingSchema.virtual('numberOfDays').get(function() {
  if (this.checkInDate && this.checkOutDate) {
    const diffTime = Math.abs(new Date(this.checkOutDate) - new Date(this.checkInDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
  }
  return 0;
});

// Virtual property for calculating the total amount the client is supposed to pay
bookingSchema.virtual('totalAmount').get(function() {
  return this.numberOfDays * this.price;
});

// Virtual property for calculating the amount left to pay
bookingSchema.virtual('amountLeftToPay').get(function() {
  const totalAmount = this.totalAmount;
  const totalWithCaution = totalAmount + this.cautionFee;
  return totalWithCaution - this.amountPaid;
});

// Ensure virtual fields are included when converting documents to JSON and objects
bookingSchema.set('toJSON', { virtuals: true });
bookingSchema.set('toObject', { virtuals: true });

const BookingModel = mongoose.model('Booking', bookingSchema);

module.exports = BookingModel;