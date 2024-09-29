const HttpError = require('../utils/httpError');
const ApartmentModel = require('../model/apartmentModel');


// Create a new apartment
exports.createApartment = async (req, res, next) => {
    try {
      const { name, type, description, maxGuests } = req.body;
  
      const newApartment = new ApartmentModel({
        name,
        type,
        description,
        maxGuests
      });
  
      await newApartment.save();
  
      res.status(201).json({
        success: true,
        message: 'Apartment created successfully',
        data: newApartment
      });
    } catch (error) {
      return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
  };
  
  // Get all apartments
  exports.getAllApartments = async (req, res, next) => {
    try {
      const apartments = await ApartmentModel.find();
      res.status(200).json({
        success: true,
        count: apartments.length,
        data: apartments
      });
    } catch (error) {
      return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
  };
  
  // Get a single apartment by ID
  exports.getApartmentById = async (req, res, next) => {
    try {
      const apartment = await ApartmentModel.findById(req.params.id);
  
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
  
      res.status(200).json({
        success: true,
        data: apartment
      });
    } catch (error) {
      return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
  };
  
  // Update an apartment
  exports.updateApartment = async (req, res, next) => {
    try {
      const { name, type, description, maxGuests, images, location } = req.body;
  
      const updatedApartment = await ApartmentModel.findByIdAndUpdate(
        req.params.id,
        { name, type, description, maxGuests, images, location },
        { new: true, runValidators: true }
      );
  
      if (!updatedApartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Apartment updated successfully',
        data: updatedApartment
      });
    } catch (error) {
      return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
  };
  
  // Delete an apartment
  exports.deleteApartment = async (req, res, next) => {
    try {
      const apartment = await ApartmentModel.findByIdAndDelete(req.params.id);
  
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Apartment not found'
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Apartment deleted successfully'
      });
    } catch (error) {
      return next(new HttpError('Deleting consumption record failed, please try again', 500));
    }
  };