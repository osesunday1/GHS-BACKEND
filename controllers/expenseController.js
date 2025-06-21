const Expense = require('../model/expenseModel');


// @desc    Create a new expense
exports.createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error('[createExpense]', err);
    res.status(500).json({ error: 'Failed to create expense', details: err.message });
  }
};

// @desc    Get all expenses (sorted by latest)
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (err) {
    console.error('[getAllExpenses]', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// @desc    Get single expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.status(200).json(expense);
  } catch (err) {
    console.error('[getExpenseById]', err);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

// @desc    Update an expense by ID
exports.updateExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('[updateExpense]', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// @desc    Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.status(200).json({ message: 'Expense deleted' });
  } catch (err) {
    console.error('[deleteExpense]', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};