const express = require('express');
const router = express.Router();
const apartmentController= require('./../controllers/apartmentController')


const {createApartment, getAllApartments, getApartmentById, updateApartment, deleteApartment} = apartmentController


router
    .route(`/`)
    .post(createApartment)
    .get(getAllApartments)

router
    .route(`/:id`)
    .get(getApartmentById)
    .patch(updateApartment)
    .delete(deleteApartment);

module.exports = router;