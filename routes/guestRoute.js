const express = require('express');
const router = express.Router();
const guestController= require('./../controllers/guestController')


const {getAllGuests, updateGuest, deleteGuest} = guestController


router
    .route(`/`)
    .get(getAllGuests)

router
    .route(`/:id`)
    .put(updateGuest)
    .delete(deleteGuest);



    
module.exports = router;