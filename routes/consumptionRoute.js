const express = require('express');
const consumptionController = require('./../controllers/consumptionController');
const router = express.Router();



// Destructure the consumption-related controllers
const {
    createConsumptionRecord,
    getAllConsumptionRecords,
    getConsumptionRecordById,
    updateConsumptionRecord,
    deleteConsumptionRecord
  } = consumptionController;


// Route to create a new consumption record
router
    .route('/')
    .post(createConsumptionRecord)
    .get(getAllConsumptionRecords);  // Optionally, you can list all consumption records

// Route to get, update, or delete a specific consumption record by ID
router
    .route('/:id')
    .get(getConsumptionRecordById)
    .put(updateConsumptionRecord)
    .delete(deleteConsumptionRecord);

module.exports = router;