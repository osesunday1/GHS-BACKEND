const ProductModel = require('../model/productModel');
const HttpError = require('../utils/httpError');


// Create a new Product item
exports.createProductItem = async (req, res, next) => {
    try {
        const { item, category, quantity, price } = req.body;

       // Create a new Product item
        const newItem = new ProductModel({
            item,
            category,
            quantity,
            price,
        });

        // Save to the database
        await newItem.save();

        res.status(201).json({
            success: true,
            message: 'Product item created successfully',
            data: newItem,
        });
    } catch (error) {
        console.error('Error creating Product item:', error);
        return next(new HttpError('Creating Product item failed, please try again.', 500));
    }
};


// Get all Product items (No pagination, No filtering)
exports.getAllProductItems = async (req, res, next) => {
    try {
        // Fetch all product items from the database
        const items = await ProductModel.find().sort({ createdAt: -1 }).lean();

        res.status(200).json({
            success: true,
            totalItems: items.length,
            data: items, // Send all product data to the frontend
        });
    } catch (error) {
        console.error('Error fetching Product items:', error);
        return next(new HttpError('Fetching Product items failed, please try again.', 500));
    }
};


// Get a single Product item by ID
exports.getProductItemById = async (req, res, next) => {
    try {
        const item = await ProductModel.findById(req.params.id);

        if (!item) {
            return next(new HttpError('Product item not found', 404));
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Error fetching Product item:', error);
        return next(new HttpError('Fetching Product item failed, please try again', 500));
    }
};

// Update an Product item
exports.updateProductItem = async (req, res, next) => {
    try {
        const { item, quantity, price } = req.body;

        const updatedItem = await ProductModel.findByIdAndUpdate(
            req.params.id,
            { item, quantity, price },
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return next(new HttpError('Product item not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Product item updated successfully',
            data: updatedItem
        });
    } catch (error) {
        console.error('Error updating Product item:', error);
        return next(new HttpError('Updating Product item failed, please try again', 500));
    }
};

// Delete an Product item
exports.deleteProductItem = async (req, res, next) => {
    try {
        const item = await ProductModel.findByIdAndDelete(req.params.id);

        if (!item) {
            return next(new HttpError('Product item not found', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Product item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting Product item:', error);
        return next(new HttpError('Deleting Product item failed, please try again', 500));
    }
};