const GuestModel = require('../model/guestModel');
const HttpError = require('../utils/httpError');
const BookingModel= require('../model/bookingsModel')
const cloudinary = require('cloudinary').v2;


// Controller function to retrieve all guests
exports.getAllGuests = async (req, res, next) => {
  try {
    // Retrieve all guests from the database
    const guests = await GuestModel.find().sort({ createdAt: -1 })
    
    // Send the response with the guests data
    res.status(200).json({
      success: true,
      count: guests.length,
      data: guests
    });
  } catch (err) {
    // Pass the error to the error handling middleware
    return next(new HttpError(`Retrieving guests failed: ${err.message}`, 500));
  }
};

// Update guest and handle photo replacement
exports.updateGuest = async (req, res, next) => {

  const guestId = req.params.id;
  const { firstName, lastName, email, phone } = req.body;
  const newPhoto = req.file; // assuming middleware like multer is used for file upload

  try {
    const guest = await GuestModel.findById(guestId);
    if (!guest) {
      return next(new HttpError('Guest not found', 404));
    }

    // Handle photo replacement if a new photo is uploaded
    let photoData = guest.photo;

    if (newPhoto) {
      // Delete old image from Cloudinary if exists
      if (guest.photo?.public_id) {
        await cloudinary.uploader.destroy(guest.photo.public_id);
      }

      // Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(newPhoto.path, {
        folder: 'guests',
      });

      photoData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Update guest info
    guest.firstName = firstName;
    guest.lastName = lastName;
    guest.email = email;
    guest.phone = phone;
    guest.photo = photoData;

    const updatedGuest = await guest.save();

    res.status(200).json({
      success: true,
      message: 'Guest updated successfully',
      data: updatedGuest,
    });
  } catch (err) {
    return next(new HttpError(`Updating guest failed: ${err.message}`, 500));
  }
};


  // Controller function to delete a guest and their associated bookings
  exports.deleteGuest = async (req, res, next) => {
    const guestId = req.params.id;
  
    try {
      // Find the guest by ID
      const guest = await GuestModel.findById(guestId);
  
      if (!guest) {
        return next(new HttpError('Guest not found', 404));
      }
  
          // Check if the guest has any associated bookings
    const bookings = await BookingModel.find({ guest: guestId });
    
    if (bookings.length > 0) {
      // If the guest has bookings, delete them
      await BookingModel.deleteMany({ guest: guestId });
    }
  
      // Delete the guest using deleteOne or findByIdAndDelete
      await GuestModel.findByIdAndDelete(guestId);
  
      res.status(200).json({
        success: true,
        message: 'Guest and associated bookings deleted successfully'
      });
    } catch (err) {
      return next(new HttpError(`Deleting guest failed: ${err.message}`, 500));
    }
  };