const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
});

const GuestModel = mongoose.model('Guest', guestSchema);

module.exports = GuestModel;