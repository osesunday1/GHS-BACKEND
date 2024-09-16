const express = require('express');
const router = express.Router();
const bookingController = require('./../controllers/bookingsController.js');

// Destructure the admin-related controllers
const {
  getTotalBookings,
  getTotalRevenue,
  getOccupancyRate,
  getAverageBookingDuration,
  getTotalGuests,
  getRepeatGuests,
  getRevenuePerApartment,
  getTotalAmountPaidPerMonth
} = bookingController;

//Admin Routes

// Route to get total bookings over a specified period
router.get('/bookings/total', getTotalBookings);

// Route to get total revenue over a specified period
router.get('/revenue/total', getTotalRevenue);

// Route to get occupancy rate of all apartments
router.get('/occupancy-rate', getOccupancyRate);

// Route to get average booking duration
router.get('/booking/average-duration', getAverageBookingDuration);

// Route to get total unique guests
router.get('/guests/total', getTotalGuests);

// Route to get repeat guests
router.get('/guests/repeat', getRepeatGuests);

// Route to get revenue per apartment
router.get('/revenue-per-apartment', getRevenuePerApartment);

// Route to get amount generated each month
router.get('/total-amount-paid-per-month', getTotalAmountPaidPerMonth);



module.exports = router;