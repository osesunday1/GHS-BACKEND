const mongoose = require('mongoose');
const ConsumptionModel = require('../model/consumptionModel');
const InventoryModel = require('../model/inventoryModel');
const HttpError = require('../utils/httpError');

// Create a new consumption record
exports.createConsumptionRecord = async (req, res, next) => {
    try {
        const { guestId, items } = req.body;

        let totalAmount = 0;

        // Check if each inventory item exists and calculate the amount
        for (const item of items) {
            const inventoryItem = await InventoryModel.findById(item.inventoryItemId);
            if (!inventoryItem) {
                throw new HttpError(`Inventory item with ID ${item.inventoryItemId} not found`, 404);
            }
            item.amount = item.quantity * inventoryItem.price;
            totalAmount += item.amount;
        }

        // Create the consumption record
        const newConsumption = new ConsumptionModel({
            guestId: guestId,
            items: items,
            totalAmount: totalAmount, // Store the calculated total amount
        });

        await newConsumption.save();

        res.status(201).json({
            success: true,
            message: 'Consumption record created successfully',
            data: newConsumption
        });
    } catch (error) {
        return next(new HttpError(error.message || 'Creating consumption record failed, please try again', 500));
    }
};

// Get all consumption records
exports.getAllConsumptionRecords = async (req, res, next) => {
    try {
        const consumptions = await ConsumptionModel.find()
            .populate('guestId')
            .populate('items.inventoryItemId'); // Populate inventory items

        res.status(200).json({
            success: true,
            count: consumptions.length,
            data: consumptions
        });
    } catch (error) {
        return next(new HttpError('Fetching consumption records failed, please try again', 500));
    }
};

// Get a specific consumption record by ID
exports.getConsumptionRecordById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid consumption record ID', 400));
        }

        const consumption = await ConsumptionModel.findById(req.params.id)
            .populate('guestId')
            .populate('items.inventoryItemId'); // Populate inventory items

        if (!consumption) {
            return next(new HttpError('Consumption record not found', 404));
        }

        res.status(200).json({
            success: true,
            data: consumption
        });
    } catch (error) {
        return next(new HttpError('Fetching consumption record failed, please try again', 500));
    }
};

// Update a specific consumption record by ID
exports.updateConsumptionRecord = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid consumption record ID', 400));
        }

        const consumption = await ConsumptionModel.findById(req.params.id);

        if (!consumption) {
            return next(new HttpError('Consumption record not found', 404));
        }

        let totalAmount = 0;

        // Validate and recalculate the amount for each item
        for (const item of items) {
            const inventoryItem = await InventoryModel.findById(item.inventoryItemId);
            if (!inventoryItem) {
                return next(new HttpError(`Inventory item with ID ${item.inventoryItemId} not found`, 404));
            }
            item.amount = item.quantity * inventoryItem.price;
            totalAmount += item.amount;
        }

        consumption.items = items;
        consumption.totalAmount = totalAmount;

        await consumption.save();

        res.status(200).json({
            success: true,
            message: 'Consumption record updated successfully',
            data: consumption
        });
    } catch (error) {
        return next(new HttpError(error.message || 'Updating consumption record failed, please try again', 500));
    }
};

// Delete a specific consumption record by ID
exports.deleteConsumptionRecord = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid consumption record ID', 400));
        }

        const consumption = await ConsumptionModel.findById(req.params.id);

        if (!consumption) {
            return next(new HttpError('Consumption record not found', 404));
        }

        // Restore the quantity in inventory for each item
        for (const item of consumption.items) {
            const inventoryItem = await InventoryModel.findById(item.inventoryItemId);
            if (inventoryItem) {
                inventoryItem.quantity += item.quantity;
                await inventoryItem.save();
            }
        }

        await ConsumptionModel.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Consumption record deleted successfully'
        });
    } catch (error) {
        return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
};