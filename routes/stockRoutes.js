const express = require('express');
const router = express.Router();

const {
  addStock,
  removeMultipleStock,
  adjustStock,
  getStockHistory,
  getSingleStockLog,
  updateStockLog,
  deleteStockLog,
} = require('../controllers/stockController');

// POST: Add stock to a product
router.post('/add', addStock);

// POST: Remove stock from a product
router.post('/remove-multiple', removeMultipleStock);

// POST: Manually adjust stock (e.g. due to damage, correction)
router.post('/adjust', adjustStock);

// GET /api/stock/history
router.get('/history', getStockHistory);

//get sinde log
router.get('/log/:id',  getSingleStockLog);

// Update a stock log and sync inventory
router.put('/log/:id',  updateStockLog);    

// Delete a log and reverse inventory impact
router.delete('/log/:id', deleteStockLog);








module.exports = router;