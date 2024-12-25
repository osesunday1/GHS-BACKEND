const express = require('express');
const router = express.Router();
const bookingController = require('./../controllers/bookingsController.js');

// Destructure the admin-related controllers
const {
  getMonthlyRevenue,
  getMonthlyBookingComparison,
  getMonthlyRevenueByApartment,
  MonthlyBookingsChart,
  getMonthlyOccupiedDates
} = bookingController;

//Admin Routes



// Route to get monthly booking comparison
router.get('/monthly-booking-comparison', getMonthlyBookingComparison); // New Route

// Route to get monthly revenue data for each apartment
router.get('/monthly-revenue-by-apartment', getMonthlyRevenueByApartment);

//get monthly booking
router.get('/bookings/monthly-total', MonthlyBookingsChart);


// Route for monthly occupied dates
router.get('/bookings/monthly-occupied-dates', getMonthlyOccupiedDates);

// Route for monthly revenue
router.get('/bookings/monthly-revenue', getMonthlyRevenue);


module.exports = router;