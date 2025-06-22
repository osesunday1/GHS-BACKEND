const express = require('express');
const router = express.Router();
const adminCotroller = require('./../controllers/adminController.js');



const {
   getTotalBookings,
   getTotalRevenue,
   getAverageLengthOfStay,
   getRepeatGuests,
   getRevenuePerApartment,
   getTopProductsSold,
   getProductSalesRevenue,
   getProductProfit,
   getStockTurnoverRate,
   getLowStockAlerts,
   getTotalExpenses,
   getTopExpenseTitles,
  } = adminCotroller

//Admin Routes



// Route to get monthly booking comparison
router.get('/total-bookings', getTotalBookings); // New Route
router.get('/total-revenue', getTotalRevenue);
router.get('/averageLengthofStay', getAverageLengthOfStay);
router.get('/repeatGuest', getRepeatGuests);
router.get('/revenuePerApartment', getRevenuePerApartment);
router.get('/top5-products', getTopProductsSold);
router.get('/product-sales-revenue', getProductSalesRevenue);
router.get('/product-profit', getProductProfit);
router.get('/stock-turnover', getStockTurnoverRate);
router.get('/low-stock-alerts', getLowStockAlerts);
router.get('/total-expenses', getTotalExpenses);
router.get('/top-titles-expenses', getTopExpenseTitles);



module.exports = router;