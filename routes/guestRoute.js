const express = require('express');
const router = express.Router();
const guestController= require('./../controllers/guestController')
const upload = require('../middleware/upload.js');



const {getAllGuests, updateGuest, deleteGuest} = guestController


router
    .route(`/`)
    .get(getAllGuests)

router
    .route(`/:id`)
    .put(upload.single('photo'), updateGuest)
    .delete(deleteGuest);



    
module.exports = router;