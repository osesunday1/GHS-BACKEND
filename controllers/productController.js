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


// Get all Product items with optional pagination and filtering
exports.getAllProductItems = async (req, res, next) => {
    try {
        const { item, category, page = 1, limit } = req.query;

        // Build the query object
        const query = {};
        if (item) {
            query.item = { $regex: item, $options: 'i' }; // Case-insensitive search
        }
        if (category) {
            query.category = category; // Exact match for category
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = limit ? parseInt(limit, 10) : null; // Parse limit or set to null
        const skip = limitNumber ? (pageNumber - 1) * limitNumber : 0;

        // Get the total count of matching items
        const totalItems = await ProductModel.countDocuments(query);

        // Fetch the matching items with optional pagination
        let items;
        if (limitNumber) {
            items = await ProductModel.find(query)
                .skip(skip)
                .limit(limitNumber)
                .sort({ createdAt: 1 }); // Paginate if limit is provided
        } else {
            items = await ProductModel.find(query).sort({ createdAt: 1 }); // Fetch all without pagination
        }

        const totalPages = limitNumber ? Math.ceil(totalItems / limitNumber) : 1;

        // Return the response
        res.status(200).json({
            success: true,
            totalItems,
            totalPages,
            currentPage: limitNumber ? pageNumber : 1,
            data: items,
        });
    } catch (error) {
        console.error('Error fetching Product items:', error);
        return next(new HttpError('Fetching Product items failed, please try again', 500));
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