const express = require('express');
const router = express.Router();
const bookingController= require('./../controllers/bookingsController.js')
const authController= require('./../controllers/authController.js')


const {createBooking, getAllBookings, updateBooking, deleteBooking} = bookingController

const {protect} = authController


router
    .route(`/`)
    .post(protect, createBooking)
    .get(protect, getAllBookings)

router
    .route(`/:id`)
    .put(protect, updateBooking)
    .delete(protect, 
        authController.restrictTo('admin'), 
        deleteBooking )    


module.exports = router;