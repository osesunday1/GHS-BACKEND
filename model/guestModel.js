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
  phone: {
    type: String
  },
  photo: {
  url: { type: String, default: '' },
  public_id: { type: String, default: '' }
}
});

const GuestModel = mongoose.model('Guest', guestSchema);

module.exports = GuestModel;