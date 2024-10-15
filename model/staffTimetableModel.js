

const mongoose = require('mongoose');

// Timetable schema for cleaning tasks
const timetableSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,  // Reference to the User model
    ref: 'User',  
    required: true  // Ensure a staff member is assigned
  },
  task: {
    type: String,  
    enum: ['Cleaning', 'Operations'],  // Currently limited to cleaning, but you can extend it.
    default: 'Cleaning'
  },
  date: {
    type: Date,  
    required: true  // The date when the task is assigned
  },
  createdAt: {
    type: Date,
    default: Date.now  // Automatically store when the entry was created
  }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;