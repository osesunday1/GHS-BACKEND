const express = require('express');
const inventoryController = require('./../controllers/inventoryController');
const router = express.Router();



// Destructure the inventory-related controllers
const {
    createInventoryRecord,
    getAllInventoryRecords,
    getInventoryRecordById,
    updateInventoryRecord,
    deleteInventoryRecord
  } = inventoryController;


// Route to create a new inventory record
router
    .route('/')
    .post(createInventoryRecord)
    .get(getAllInventoryRecords);  // Optionally, you can list all inventory records

// Route to get, update, or delete a specific inventory record by ID
router
    .route('/:id')
    .get(getInventoryRecordById)
    .put(updateInventoryRecord)
    .delete(deleteInventoryRecord);

module.exports = router;