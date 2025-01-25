const express = require('express');
const expenseController = require('../controllers/expenseController');
const router = express.Router();

const {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
} = expenseController;

router
    .route('/')
    .post(createExpense)
    .get(getAllExpenses);

router
    .route('/:id')
    .get(getExpenseById)
    .put(updateExpense)
    .delete(deleteExpense);

module.exports = router;