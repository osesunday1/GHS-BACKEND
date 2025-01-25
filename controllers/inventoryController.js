const mongoose = require('mongoose');
const InventoryModel = require('../model/inventoryModel');
const ProductModel = require('../model/productModel');
const HttpError = require('../utils/httpError');

// Create a new inventory record
exports.createInventoryRecord = async (req, res, next) => {
    try {
        const { guestId, items } = req.body;
        let totalAmount = 0;

        // Check if each product item exists and calculate the amount
        for (const item of items) {
            const productItem = await ProductModel.findById(item.productItemId);
            if (!productItem) {
                throw new HttpError(`product item with ID ${item.productItemId} not found`, 404);
            }
            if (productItem.quantity < item.quantity) {
                throw new HttpError(`Not enough quantity of ${productItem.item} in product`, 400);
            }

            item.amount = item.quantity * productItem.price;
            totalAmount += item.amount;

            // Deduct item quantity from product
            productItem.quantity -= item.quantity;
            await productItem.save();
        }

        // Create the inventory record
        const newInventory = new InventoryModel({
            guestId: guestId,
            items: items,
            totalAmount: totalAmount, // Store the calculated total amount
        });

        await newInventory.save();

        res.status(201).json({
            success: true,
            message: 'Inventory record created successfully',
            data: newInventory
        });
    } catch (error) {
        return next(new HttpError(error.message || 'Creating inventory record failed, please try again', 500));
    }
};




// === Get all inventory records with pagination and filtering
exports.getAllInventoryRecords = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, guestName } = req.query;

        const skip = (page - 1) * limit;

        // Fetch all inventory records with populated fields
        const inventories = await InventoryModel.find()
            .populate('guestId')
            .populate('items.productItemId')
            .sort({ createdAt: -1 });

        // Filter records by guest name if provided
        const filteredInventories = guestName
            ? inventories.filter((inventory) =>
                inventory.guestId &&
                `${inventory.guestId.firstName} ${inventory.guestId.lastName}`
                    .toLowerCase()
                    .includes(guestName.toLowerCase())
            )
            : inventories;

        const totalInventories = filteredInventories.length;

        // Paginate the filtered records
        const paginatedInventories = filteredInventories.slice(skip, skip + Number(limit));

        res.status(200).json({
            success: true,
            totalInventories,
            totalPages: Math.ceil(totalInventories / limit),
            currentPage: Number(page),
            data: paginatedInventories,
        });
    } catch (error) {
        console.error('Error fetching inventory records:', error);
        return next(new HttpError('Fetching inventory records failed, please try again', 500));
    }
};


// Get a specific inventory record by ID
exports.getInventoryRecordById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid inventory record ID', 400));
        }

        const inventory = await InventoryModel.findById(req.params.id)
            .populate('guestId')
            .populate('items.productItemId'); // Populate product items

        if (!inventory) {
            return next(new HttpError(`Inventory record not found: ${error}`, 404));
        }

        res.status(200).json({
            success: true,
            data: inventory
        });
    } catch (error) {
        return next(new HttpError( `Fetching inventory record failed, please try again: ${error}`, 500));
    }
};

// Update a specific inventory record by ID
exports.updateInventoryRecord = async (req, res, next) => {
    try {
        const { items } = req.body;

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid inventory record ID', 400));
        }

        const inventory = await InventoryModel.findById(req.params.id);

        if (!inventory) {
            return next(new HttpError('Inventory record not found', 404));
        }

        // Revert product quantities based on the original inventory record
        for (const originalItem of inventory.items) {
            const productItem = await ProductModel.findById(originalItem.productItemId);
            if (productItem) {
                productItem.quantity += originalItem.quantity;
                await productItem.save();
            }
        }

        // Update items with new quantities and recalculate total amount
        let totalAmount = 0;

        for (const item of items) {
            const productItem = await ProductModel.findById(item.productItemId);
            if (!productItem) {
                return next(new HttpError(`product item with ID ${item.productItemId} not found`, 404));
            }
            if (productItem.quantity < item.quantity) {
                throw new HttpError(`Not enough quantity of ${productItem.item} in product`, 400);
            }

            item.amount = item.quantity * productItem.price;
            totalAmount += item.amount;

            // Deduct the updated quantity from product
            productItem.quantity -= item.quantity;
            await productItem.save();
        }

        inventory.items = items;
        inventory.totalAmount = totalAmount;

        await inventory.save();

        res.status(200).json({
            success: true,
            message: 'Inventory record updated successfully',
            data: inventory
        });
    } catch (error) {
        return next(new HttpError(error.message || 'Updating inventory record failed, please try again', 500));
    }
};

// Delete a specific inventory record by ID
exports.deleteInventoryRecord = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return next(new HttpError('Invalid inventory record ID', 400));
        }

        const inventory = await InventoryModel.findById(req.params.id);

        if (!inventory) {
            return next(new HttpError('Inventory record not found', 404));
        }

        // Restore the quantity in product for each item
        for (const item of inventory.items) {
            const productItem = await ProductModel.findById(item.productItemId);
            if (productItem) {
                productItem.quantity += item.quantity;
                await productItem.save();
            }
        }

        await InventoryModel.deleteOne({ _id: req.params.id });

        res.status(200).json({
            success: true,
            message: 'Inventory record deleted successfully'
        });
    } catch (error) {
        return next(new HttpError('Deleting inventory record failed, please try again', 500));
    }
};