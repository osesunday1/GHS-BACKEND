const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const router = express.Router();



// Destructure the inventory-related controllers
const {
    createInventoryItem,
    getAllInventoryItems,
    getInventoryItemById,
    updateInventoryItem,
    deleteInventoryItem
  } = inventoryController;


router
    .route('/')
    .post(createInventoryItem)
    .get(getAllInventoryItems);

router
    .route('/:id')
    .get(getInventoryItemById)
    .put(updateInventoryItem)
    .delete(deleteInventoryItem);

module.exports = router;