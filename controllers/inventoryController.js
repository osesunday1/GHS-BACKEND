const InventoryModel = require('../model/inventoryModel');
const HttpError = require('../utils/httpError');


// Create a new inventory item
exports.createInventoryItem = async (req, res, next) => {
    try {
        const { item, quantity, price } = req.body;

        const newItem = new InventoryModel({
            item,
            quantity,
            price
        });

        await newItem.save();

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            data: newItem
        });
    } catch (error) {
        return next(new HttpError('Creating inventory item failed, please try again', 500));
    }
};

// Get all inventory items
exports.getAllInventoryItems = async (req, res, next) => {
    try {
        const items = await InventoryModel.find();

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        return next(new HttpError('Fetching inventory items failed, please try again', 500));
    }
};

// Get a single inventory item by ID
exports.getInventoryItemById = async (req, res, next) => {
    try {
        const item = await InventoryModel.findById(req.params.id);

        if (!item) {
            return next(new HttpError('Inventory item not found', 404));
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error fetching inventory item:', error);
        return next(new HttpError('Fetching inventory item failed, please try again', 500));
    }
};

// Update an inventory item
exports.updateInventoryItem = async (req, res, next) => {
    try {
        const { item, quantity, price } = req.body;

        const updatedItem = await InventoryModel.findByIdAndUpdate(
            req.params.id,
            { item, quantity, price },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return next(new HttpError('Inventory item not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item updated successfully',
            data: updatedItem
        });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        return next(new HttpError('Updating inventory item failed, please try again', 500));
    }
};

// Delete an inventory item
exports.deleteInventoryItem = async (req, res, next) => {
    try {
        const item = await InventoryModel.findByIdAndDelete(req.params.id);

        if (!item) {
            return next(new HttpError('Inventory item not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Inventory item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting inventory item:', error);
        return next(new HttpError('Deleting inventory item failed, please try again', 500));
    }
};