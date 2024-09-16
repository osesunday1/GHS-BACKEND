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
exports.getAllBookings = async (req, res, next) => {
  try {
    // Retrieve all bookings from the database
    // Populate the 'guest' field with relevant details
    const bookings = await BookingModel.find().populate('guest', 'firstName lastName email phone address');

    // Send the response with the bookings data
    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    // Pass the error to the error handling middleware
    return next(new HttpError(`Retrieving bookings failed (${err.message})`, 400));
  }
};


// Controller function to update a booking
exports.updateBooking = async (req, res, next) => {
  const bookingId = req.params.id;
  const { checkInDate, checkOutDate, apartmentId, numberOfRooms, price, amountPaid, cautionFee } = req.body;

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


///////////////////////////////get total bookings\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getTotalBookings = async (req, res, next) => {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'
    
    let matchStage = {};

    if (period === 'daily') {
      matchStage = { $dayOfYear: { $eq: new Date().getDayOfYear() } };
    } else if (period === 'weekly') {
      matchStage = { $week: { $eq: new Date().getWeek() } };
    } else if (period === 'monthly') {
      matchStage = { $month: { $eq: new Date().getMonth() + 1 } };
    }

    const totalBookings = await BookingModel.aggregate([
      { $match: matchStage },
      { $count: "totalBookings" }
    ]);

    res.status(200).json({ data: totalBookings[0]?.totalBookings || 0 });
  } catch (err) {
    return next(new HttpError(`Fetching total bookings failed: ${err.message}`, 500));
  }
};


///////////////////////////////get total revenue\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getTotalRevenue = async (req, res, next) => {
  try {
    const { period } = req.query; // 'daily', 'weekly', 'monthly'
    
    let matchStage = {};

    if (period === 'daily') {
      matchStage = { $dayOfYear: { $eq: new Date().getDayOfYear() } };
    } else if (period === 'weekly') {
      matchStage = { $week: { $eq: new Date().getWeek() } };
    } else if (period === 'monthly') {
      matchStage = { $month: { $eq: new Date().getMonth() + 1 } };
    }

    const totalRevenue = await BookingModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, totalRevenue: { $sum: "$price" } } }
    ]);

    res.status(200).json({ data: totalRevenue[0]?.totalRevenue || 0 });
  } catch (err) {
    return next(new HttpError(`Fetching total revenue failed: ${err.message}`, 500));
  }
};


///////////////////////////////get occupancy rate\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getOccupancyRate = async (req, res, next) => {
  try {
    const totalApartments = await ApartmentModel.countDocuments();

    // Assuming you want to calculate occupancy for the current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1); // January 1st of the current year
    const endOfYear = new Date(new Date().getFullYear(), 11, 31); // December 31st of the current year

    // Find total days in the year
    const totalDaysInYear = (endOfYear - startOfYear) / (1000 * 60 * 60 * 24);

    // Aggregate to calculate the total number of days apartments are occupied
    const occupiedDays = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: { $gte: startOfYear, $lte: endOfYear },
          checkOutDate: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: null,
          totalOccupiedDays: {
            $sum: {
              $subtract: [
                { $min: [ "$checkOutDate", endOfYear ] },
                { $max: [ "$checkInDate", startOfYear ] }
              ]
            }
          }
        }
      }
    ]);

    // Calculate occupancy rate
    const data = ((occupiedDays[0]?.totalOccupiedDays || 0) / (totalDaysInYear * totalApartments)) * 100;

    res.status(200).json({ data });
  } catch (err) {
    return next(new HttpError(`Fetching occupancy rate failed: ${err.message}`, 500));
  }
};


///////////////////////////////get booking duration\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getAverageBookingDuration = async (req, res, next) => {
  try {
    const avgDuration = await BookingModel.aggregate([
      {
        $group: {
          _id: null,
          averageDuration: { $avg: "$numberOfDays" }
        }
      }
    ]);

    res.status(200).json({ averageDuration: avgDuration[0]?.averageDuration || 0 });
  } catch (err) {
    return next(new HttpError(`Fetching average booking duration failed: ${err.message}`, 500));
  }
};


///////////////////////////////get total guest\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getTotalGuests = async (req, res, next) => {
  try {
    const data = await GuestModel.countDocuments();

    res.status(200).json({ data });
  } catch (err) {
    return next(new HttpError(`Fetching total guests failed: ${err.message}`, 500));
  }
};

///////////////////////////////get repeat guest\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
exports.getRepeatGuests = async (req, res, next) => {
  try {
    const repeatGuests = await BookingModel.aggregate([
      { $group: { _id: "$guest", bookings: { $sum: 1 } } },
      { $match: { bookings: { $gt: 1 } } },
      { $count: "repeatGuests" }
    ]);

    res.status(200).json({ data: repeatGuests[0]?.repeatGuests || 0 });
  } catch (err) {
    return next(new HttpError(`Fetching repeat guests failed: ${err.message}`, 500));
  }
};



//////////////////////revenue per apartment\\\\\\\\\\\\\\\\\\\\\\
exports.getRevenuePerApartment = async (req, res, next) => {
  try {
    // Get all apartments to ensure we return data for all of them
    const apartments = await ApartmentModel.find().select('name');

    // Aggregate bookings by apartment and by month
    const revenueData = await BookingModel.aggregate([
      {
        $group: {
          _id: {
            apartment: '$apartmentName',
            month: { $month: '$checkInDate' }
          },
          totalRevenue: { $sum: '$price' }
        }
      },
      {
        $sort: {
          '_id.month': 1 // Sort by month
        }
      },
      {
        $group: {
          _id: '$_id.apartment',
          monthlyRevenue: {
            $push: {
              month: '$_id.month',
              revenue: '$totalRevenue'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          apartmentName: '$_id',
          monthlyRevenue: 1
        }
      }
    ]);

    // Prepare the data for the chart
    const data = apartments.map(apartment => {
      const revenueInfo = revenueData.find(rd => rd.apartmentName === apartment.name);
      const monthlyRevenue = Array(12).fill(0); // Initialize all months with 0 revenue

      if (revenueInfo) {
        revenueInfo.monthlyRevenue.forEach(data => {
          monthlyRevenue[data.month - 1] = data.revenue; // Fill the correct month index
        });
      }

      return {
        apartmentName: apartment.name,
        revenue: monthlyRevenue
      };
    });

    // Send the response with the aggregated data
    res.status(200).json({data: data});
  } catch (err) {
    return next(new HttpError(`Fetching revenue per apartment failed: ${err.message}`, 500));
  }
};

/////////////////////////////total amount generated each month\\\\\\\

exports.getTotalAmountPaidPerMonth = async (req, res, next) => {
  try {
    // Aggregate bookings by month and sum the amountPaid field
    const monthlyPayments = await BookingModel.aggregate([
      {
        $group: {
          _id: { month: { $month: '$checkInDate' } },
          totalAmountPaid: { $sum: '$amountPaid' }
        }
      },
      {
        $sort: {
          '_id.month': 1 // Sort by month (January to December)
        }
      },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          totalAmountPaid: 1
        }
      }
    ]);

    // Create an array with 12 elements for each month initialized with 0
    const monthlyData = Array(12).fill(0);

    // Populate the monthlyData array with the aggregated values
    monthlyPayments.forEach(payment => {
      monthlyData[payment.month - 1] = payment.totalAmountPaid; // month - 1 to match array index (0-based)
    });

    // Send the response with the aggregated data
    res.status(200).json({ data: monthlyData });
  } catch (err) {
    return next(new HttpError(`Fetching total amount paid per month failed: ${err.message}`, 500));
  }
};







  /* new booking
  exports.createBooking = async (req, res, next) => {
  try {
    const { guestName, checkInDate, checkOutDate, roomName, rooms } = req.body;

    const newBooking = new BookingModel({
      guestName,
      checkInDate,
      checkOutDate,
      roomName,
      rooms,
    });

    await newBooking.save();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking,
    });
  } catch (error) {
    return next(new HttpError(`Creating booking failed (${err})`, 500))
  }
};
  */