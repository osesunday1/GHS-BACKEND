const express = require('express');
const router = express.Router();
const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');

// POST: Create a new expense
router.post('/', createExpense);

// GET: All expenses
router.get('/', getAllExpenses);

// GET: Single expense by ID
router.get('/:id', getExpenseById);

// PUT: Update expense
router.put('/:id', updateExpense);

// DELETE: Remove expense
router.delete('/:id', deleteExpense);

module.exports = router;