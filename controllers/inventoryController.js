const InventoryModel = require('../model/inventoryModel');
const HttpError = require('../utils/httpError');


// Create a new inventory item
exports.createInventoryItem = async (req, res, next) => {
    try {
        const { item, category, quantity, price } = req.body;

       // Create a new inventory item
        const newItem = new InventoryModel({
            item,
            category,
            quantity,
            price,
        });

        // Save to the database
        await newItem.save();

        res.status(201).json({
            success: true,
            message: 'Inventory item created successfully',
            data: newItem,
        });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return next(new HttpError('Creating inventory item failed, please try again.', 500));
    }
};


// Get all inventory items with pagination and filtering
exports.getAllInventoryItems = async (req, res, next) => {
    try {
      const { item, category, page = 1, limit = 10 } = req.query;
  
      // Build the query object
      const query = {};
      if (item) {
        query.item = { $regex: item, $options: 'i' }; // Case-insensitive search
      }
      if (category) {
        query.category = category; // Exact match for category
      }

      
  
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const skip = (pageNumber - 1) * limitNumber;
  
      // Get the total count of matching items
      const totalItems = await InventoryModel.countDocuments(query);
      
  
      // Fetch the matching items with pagination
      const items = await InventoryModel.find(query)
        .skip(skip)
        .limit(limitNumber)
        .sort({ createdAt: 1 }); // Fetch items matching query with pagination

        
  
      const totalPages = Math.ceil(totalItems / limitNumber);
  
      // Return the response
      res.status(200).json({
        success: true,
        totalItems,
        totalPages,
        currentPage: pageNumber,
        data: items,
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