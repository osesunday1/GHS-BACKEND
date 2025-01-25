const ExpenseModel = require('../model/expenseModel');
const HttpError = require('../utils/httpError');

// Create a new expense
exports.createExpense = async (req, res, next) => {
    try {
        const { description, amount, category, date } = req.body;
        
        const newExpense = new ExpenseModel({
            description,
            amount,
            category,
            date,
        });

        await newExpense.save();

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: newExpense,
        });
    } catch (error) {
        console.error('Error creating expense:', error);
        return next(new HttpError(`Creating expense failed, please try again: ${error}`, 500));
    }
};

// Get all expenses with pagination and filtering
exports.getAllExpenses = async (req, res, next) => {
    try {
        const { category, page = 1, limit = 10, minAmount, maxAmount } = req.query;

        // Build query object
        const query = {};
        if (category) query.category = category; // Filter by category
        if (minAmount || maxAmount) {
            query.amount = {};
            if (minAmount) query.amount.$gte = parseFloat(minAmount); // Minimum amount filter
            if (maxAmount) query.amount.$lte = parseFloat(maxAmount); // Maximum amount filter
        }

        // Convert page and limit to numbers and handle invalid values
        const pageNumber = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.max(1, parseInt(limit, 10));

        // Calculate skip for pagination
        const skip = (pageNumber - 1) * limitNumber;

        // Get total count of expenses matching the query
        const totalExpenses = await ExpenseModel.countDocuments(query);

        // Fetch expenses with pagination and sorting
        const expenses = await ExpenseModel.find(query)
            .sort({ date: -1 }) // Sort by most recent date
            .skip(skip)
            .limit(limitNumber);

        // Return paginated expenses data
        res.status(200).json({
            success: true,
            totalExpenses,
            totalPages: Math.ceil(totalExpenses / limitNumber),
            currentPage: pageNumber,
            data: expenses,
        });
    } catch (error) {
        console.error('Error fetching expenses:', error);
        return next(new HttpError(`Fetching expenses failed, please try again: ${error.message}`, 500));
    }
};


// Get a single expense by ID
exports.getExpenseById = async (req, res, next) => {
    try {
        const expense = await ExpenseModel.findById(req.params.id);

        if (!expense) {
            return next(new HttpError('Expense not found', 404));
        }

        res.status(200).json({
            success: true,
            data: expense,
        });
    } catch (error) {
        console.error('Error fetching expense:', error);
        return next(new HttpError('Fetching expense failed, please try again', 500));
    }
};


// Update an expense
// Update an expense by ID
exports.updateExpense = async (req, res, next) => {
    try {
        const { description, amount, category, date } = req.body;

        // Find the expense by ID and update it
        const updatedExpense = await ExpenseModel.findByIdAndUpdate(
            req.params.id,
            { description, amount, category, date },
            { new: true, runValidators: true } // Return the updated document and run validations
        );

        if (!updatedExpense) {
            return next(new HttpError('Expense not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: updatedExpense,
        });
    } catch (error) {
        console.error('Error updating expense:', error);
        return next(new HttpError('Updating expense failed, please try again', 500));
    }
};

// Delete an expense by ID
exports.deleteExpense = async (req, res, next) => {
    try {
        // Find and delete the expense by ID
        const deletedExpense = await ExpenseModel.findByIdAndDelete(req.params.id);

        if (!deletedExpense) {
            return next(new HttpError('Expense not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting expense:', error);
        return next(new HttpError('Deleting expense failed, please try again', 500));
    }
};