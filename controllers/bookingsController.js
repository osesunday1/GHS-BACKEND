const BookingModel = require('../model/bookingsModel');
const GuestModel = require('../model/guestModel');
const ApartmentModel = require('../model/apartmentModel');
const HttpError = require('../utils/httpError');


// 1. Controller function to create a booking
exports.createBooking = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, address, checkInDate, checkOutDate, apartmentId, numberOfRooms, price, amountPaid, cautionFee } = req.body;

    // Find the selected apartment by ID
    const apartment = await ApartmentModel.findById(apartmentId);
    if (!apartment) {
      return next(new HttpError('Apartment not found', 404));
    }

    // Find an existing guest by email or create a new one
    let guest = await GuestModel.findOne({ email });
    if (!guest) {
      guest = new GuestModel({ firstName, lastName, email, phone, address });
      await guest.save();
    } else {
      guest.firstName = firstName;
      guest.lastName = lastName;
      guest.phone = phone;
      guest.address = address;
      await guest.save();
    }

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
// Get all bookings with pagination, search, and sorting
exports.getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, guestName } = req.query;

    // Construct query object
    const query = {};
    if (guestName) {
      query['guest.firstName'] = { $regex: guestName, $options: 'i' };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch total bookings count
    const totalBookings = await BookingModel.countDocuments(query);

    // Fetch bookings with pagination and sorting (most recent first)
    const bookings = await BookingModel.find(query)
      .populate('guest', 'firstName lastName email phone') // Populate guest fields
      .sort({ checkInDate: -1 }) // Sort by creation date (most recent first)
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: Number(page),
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



//====== Total Monthly ernings card ====///

exports.getMonthlyRevenue = async (req, res, next) => {
  const { year, month } = req.query;

  if (!year || isNaN(year) || !month || isNaN(month)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing year and month parameters.",
    });
  }

  try {
    const startDate = new Date(year, month - 1, 1); // Start of the month
    const endDate = new Date(year, month, 0, 23, 59, 59); // End of the month

    const data = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $addFields: {
          numberOfDays: {
            $ceil: {
              $divide: [
                { $subtract: ["$checkOutDate", "$checkInDate"] },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
      },
      {
        $project: {
          revenue: { $multiply: ["$numberOfDays", "$price"] }, // Calculate revenue
        },
      },
      {
        $group: {
          _id: null, // Combine all bookings
          totalRevenue: { $sum: "$revenue" }, // Sum the revenue across all bookings
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: data.length > 0 ? data[0].totalRevenue : 0,
      },
    });
  } catch (err) {
    next(new Error(`Failed to fetch monthly revenue data: ${err.message}`));
  }
};


///// ==== Controller to fetch monthly booking data for a specific year=====\\\\\
exports.getMonthlyBookingComparison = async (req, res, next) => {
  const { year } = req.query; // Year will be sent as a query parameter

  try {
    const bookings = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$checkInDate" },
            apartmentName: "$apartmentName"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.month",
          apartments: {
            $push: {
              apartmentName: "$_id.apartmentName",
              count: "$count"
            }
          }
        }
      },
      { $sort: { _id: 1 } } // Sort by month
    ]);

    res.status(200).json({
      success: true,
      data: bookings
    });
  } catch (err) {
    next(new Error(`Fetching booking comparison failed: ${err.message}`));
  }
}


//============== Get Monthly Revenue ==========////

exports.getMonthlyRevenueByApartment = async (req, res, next) => {
  const { year } = req.query;

  if (!year || isNaN(year)) {
    return res.status(400).json({ success: false, message: "Invalid or missing year parameter." });
  }

  try {
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31`);

    const data = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $addFields: {
          numberOfDays: {
            $ceil: {
              $divide: [
                { $subtract: ["$checkOutDate", "$checkInDate"] },
                1000 * 60 * 60 * 24, // Convert milliseconds to days
              ],
            },
          },
        },
      },
      {
        $project: {
          month: { $month: "$checkInDate" },
          apartmentName: 1,
          revenue: { $multiply: ["$numberOfDays", "$price"] },
        },
      },
      {
        $group: {
          _id: {
            month: "$month",
            apartmentName: "$apartmentName",
          },
          totalRevenue: { $sum: "$revenue" },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          apartments: {
            $push: {
              apartmentName: "$_id.apartmentName",
              totalRevenue: "$totalRevenue",
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month
      },
    ]);

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(new Error(`Failed to fetch monthly revenue data: ${err.message}`));
  }
};

//====== get monthly booking===///

exports.MonthlyBookingsChart = async (req, res, next) => {
  const { year, month, expectedBookings } = req.query;

  if (!year || !month || isNaN(year) || isNaN(month) || !expectedBookings || isNaN(expectedBookings)) {
    return res.status(400).json({
      success: false,
      message: "Year, month, and expectedBookings are required and must be valid numbers.",
    });
  }

  try {
    const startDate = new Date(year, month - 1, 1); // First day of the month
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    const totalBookings = await BookingModel.countDocuments({
      checkInDate: { $gte: startDate, $lte: endDate },
    });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        expectedBookings: parseInt(expectedBookings, 10),
      },
    });
  } catch (err) {
    next(new Error(`Failed to fetch monthly bookings: ${err.message}`));
  }
};


// ==== monthly occupied dates ====
exports.getMonthlyOccupiedDates = async (req, res, next) => {
  const { year, month, expectedDays } = req.query;

  if (!year || !month || isNaN(year) || isNaN(month) || !expectedDays || isNaN(expectedDays)) {
    return res.status(400).json({
      success: false,
      message: "Year, month, and expectedDays are required and must be valid numbers.",
    });
  }

  try {
    const startDate = new Date(year, month - 1, 1); // First day of the month
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month

    // Fetch bookings that overlap with the given month
    const bookings = await BookingModel.find({
      $or: [
        { checkInDate: { $gte: startDate, $lte: endDate } },
        { checkOutDate: { $gte: startDate, $lte: endDate } },
        { checkInDate: { $lte: startDate }, checkOutDate: { $gte: endDate } },
      ],
    });

    // Calculate the number of occupied dates
    let totalOccupiedDates = 0;

    bookings.forEach((booking) => {
      const bookingStart = booking.checkInDate < startDate ? startDate : booking.checkInDate;
      const bookingEnd = booking.checkOutDate > endDate ? endDate : booking.checkOutDate;

      const diffTime = Math.abs(bookingEnd - bookingStart);
      const occupiedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
      totalOccupiedDates += occupiedDays;
    });

    res.status(200).json({
      success: true,
      data: {
        totalOccupiedDates,
        expectedDays: parseInt(expectedDays, 10),
      },
    });
  } catch (err) {
    next(new Error(`Failed to fetch monthly occupied dates: ${err.message}`));
  }
};

