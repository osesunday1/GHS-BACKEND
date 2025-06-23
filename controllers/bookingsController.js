const BookingModel = require('../model/bookingsModel');
const GuestModel = require('../model/guestModel');
const ApartmentModel = require('../model/apartmentModel');
const HttpError = require('../utils/httpError');
const cloudinary = require('cloudinary').v2;

// 1. Controller function to create a booking
exports.createBooking = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, address, checkInDate, checkOutDate, apartmentId, numberOfRooms, price, amountPaid, cautionFee } = req.body;

    let photoData = null;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'guests',
      });

      photoData = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    // Find the selected apartment by ID
    const apartment = await ApartmentModel.findById(apartmentId);
    if (!apartment) {
      return next(new HttpError('Apartment not found', 404));
    }

    // Find an existing guest by email or create a new one
    let guest = new GuestModel({ firstName, lastName, phone, photo: photoData });
    await guest.save(); 

    // Create a new booking linked to the guest and apartment
    const newBooking = new BookingModel({
      guest: guest._id,
      checkInDate,
      checkOutDate,
      apartmentName: apartment.name,
      numberOfRooms,
      price,
      amountPaid,
      cautionFee
    });
    await newBooking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: newBooking,
        guest: guest
      }
    });
  } catch (err) {
    return next(new HttpError(`Creating booking failed (${err.message})`, 500));
  }
};

// 2. Controller function to get all bookings
// Get all bookings without pagination
exports.getAllBookings = async (req, res, next) => {
  try {
    const { guestName } = req.query;

    // Construct query object
    const query = {};
    if (guestName) {
      query['guest.firstName'] = { $regex: guestName, $options: 'i' };
    }

    // Fetch all bookings (filtered if guestName is provided)
    const bookings = await BookingModel.find(query)
      .populate('guest', 'firstName lastName email phone photo') // Populate guest fields
      .sort({ checkInDate: -1 }); // Most recent bookings first

    res.status(200).json({
      success: true,
      totalBookings: bookings.length,
      data: bookings,
    });
  } catch (err) {
    next(new HttpError('Failed to fetch bookings', 500));
  }
};


// Controller function to update a booking
exports.updateBooking = async (req, res, next) => {
  const bookingId = req.params.id;
  const { checkInDate, checkOutDate, apartmentId, numberOfRooms, price, amountPaid, cautionFee, apartmentName } = req.body;

  try {
    // Find the booking by ID
    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      return next(new HttpError('Booking not found', 404));
    }

    // Update the booking details
    booking.checkInDate = checkInDate || booking.checkInDate;
    booking.checkOutDate = checkOutDate || booking.checkOutDate;
    booking.apartmentName = apartmentId || booking.apartmentName;
    booking.numberOfRooms = numberOfRooms || booking.numberOfRooms;
    booking.price = price || booking.price;
    booking.amountPaid = amountPaid || booking.amountPaid;
    booking.cautionFee = cautionFee || booking.cautionFee;
    booking.apartmentName = apartmentName || booking.apartmentName;

    // Save the updated booking
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (err) {
    return next(new HttpError(`Updating booking failed: ${err.message}`, 500));
  }
};


// Controller function to delete a booking
exports.deleteBooking = async (req, res, next) => {
  const bookingId = req.params.id;

  try {
    // Find and delete the booking by ID
    const booking = await BookingModel.findByIdAndDelete(bookingId);

    if (!booking) {
      return next(new HttpError('Booking not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (err) {
    return next(new HttpError(`Deleting booking failed: ${err.message}`, 500));
  }
};




