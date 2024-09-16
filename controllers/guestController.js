const GuestModel = require('../model/guestModel');
const HttpError = require('../utils/httpError');






// Controller function to retrieve all guests
exports.getAllGuests = async (req, res, next) => {
  try {
    // Retrieve all guests from the database
    const guests = await GuestModel.find();

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

// Controller function to update a guest
exports.updateGuest = async (req, res, next) => {
    const guestId = req.params.id;
    const { firstName, lastName, email, phone } = req.body;
  
    try {
      // Find the guest by ID and update their details
      const updatedGuest = await GuestModel.findByIdAndUpdate(
        guestId,
        { firstName, lastName, email, phone },
        { new: true, runValidators: true } // Return the updated document and run validators
      );
  
      if (!updatedGuest) {
        return next(new HttpError('Guest not found', 404));
      }
  
      res.status(200).json({
        success: true,
        message: 'Guest updated successfully',
        data: updatedGuest
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
  
      // Delete all bookings associated with this guest
      await BookingModel.deleteMany({ guest: guestId });
  
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