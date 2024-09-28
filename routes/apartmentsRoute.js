const express = require('express');
const router = express.Router();
const apartmentController= require('./../controllers/apartmentController')
const authController= require('./../controllers/authController.js')


const {createApartment, getAllApartments, getApartmentById, updateApartment, deleteApartment} = apartmentController
const {protect} = authController



router
    .route(`/`)
    .post(protect, createApartment)
    .get(protect, getAllApartments)

    
router
    .route(`/:id`)
    .get(protect, getApartmentById)
    .patch(protect, authController.restrictTo('admin'), updateApartment)
    .delete(protect, authController.restrictTo('admin'), deleteApartment);


module.exports = router;