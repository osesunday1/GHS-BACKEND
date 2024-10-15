const express = require('express');
const staffTimetableController = require('./../controllers/staffTimetableController');
const router = express.Router();
const authController= require('./../controllers/authController.js')



const {createTimetable, getAllTimetables, updateTimetable, deleteTimetable} = staffTimetableController

const {protect} = authController

router
    .route(`/`)
    .post(protect, createTimetable)
    .get(protect, getAllTimetables)

router
    .route(`/:id`)
    .put(protect, updateTimetable)
    .delete(protect, deleteTimetable)


module.exports = router;