const mongoose = require('mongoose');
const HttpError = require('../utils/httpError');
const BookingModel = require('../model/bookingsModel');
const StockLogModel= require('../model/StockLogModel');
const Expense = require('../model/expenseModel');


// Get total number of bookings between two dates

// Get total number of bookings between two dates
exports.getTotalBookings = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return next(new HttpError('Invalid date format.', 400));
    }

    const totalBookings = await BookingModel.countDocuments({
      checkInDate: { $gte: startDate },
      checkOutDate: { $lte: endDate },
    });

    res.status(200).json({
      success: true,
      totalBookings,
      start: startDate,
      end: endDate,
    });
  } catch (err) {
    next(new HttpError(`Failed to fetch total bookings: ${err.message}`, 500));
  }
};



// Get total amount made between two dates based on bookings
// Get total expected amount between two dates (numberOfDays * price)
exports.getTotalRevenue = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return next(new HttpError('Invalid date format.', 400));
    }

    // Compute totalAmount = (checkOutDate - checkInDate) in days * price
    const result = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: { $gte: startDate },
          checkOutDate: { $lte: endDate },
        },
      },
      {
        $project: {
          numberOfDays: {
            $ceil: {
              $divide: [
                { $subtract: ['$checkOutDate', '$checkInDate'] },
                1000 * 60 * 60 * 24 // ms to days
              ]
            }
          },
          price: 1
        }
      },
      {
        $project: {
          totalAmount: { $multiply: ['$numberOfDays', '$price'] }
        }
      },
      {
        $group: {
          _id: null,
          totalExpectedRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalExpectedRevenue = result[0]?.totalExpectedRevenue || 0;

    res.status(200).json({
      success: true,
      totalExpectedRevenue,
      start: startDate,
      end: endDate
    });

  } catch (err) {
    next(new HttpError(`Failed to calculate total expected amount: ${err.message}`, 500));
  }
};


// Get average length of stay between two dates
exports.getAverageLengthOfStay = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return next(new HttpError('Invalid date format.', 400));
    }

    // Aggregate to compute number of days and average
    const result = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: { $gte: startDate },
          checkOutDate: { $lte: endDate },
        },
      },
      {
        $project: {
          numberOfDays: {
            $ceil: {
              $divide: [
                { $subtract: ['$checkOutDate', '$checkInDate'] },
                1000 * 60 * 60 * 24 // ms to days
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          averageLengthOfStay: { $avg: '$numberOfDays' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const stats = result[0] || { averageLengthOfStay: 0, totalBookings: 0 };

    res.status(200).json({
      success: true,
      start: startDate,
      end: endDate,
      totalBookings: stats.totalBookings,
      averageLengthOfStay: stats.averageLengthOfStay,
    });

  } catch (err) {
    next(new HttpError(`Failed to calculate average length of stay: ${err.message}`, 500));
  }
};



// Get count of repeat guests using first + last name
exports.getRepeatGuests = async (req, res, next) => {
  try {
    const result = await BookingModel.aggregate([
      {
        // Populate guest reference so we can access name fields
        $lookup: {
          from: 'guests',
          localField: 'guest',
          foreignField: '_id',
          as: 'guestInfo'
        }
      },
      {
        // Unwind the array returned by $lookup
        $unwind: '$guestInfo'
      },
      {
        // Group by guest's full name
        $group: {
          _id: {
            firstName: '$guestInfo.firstName',
            lastName: '$guestInfo.lastName'
          },
          bookingCount: { $sum: 1 }
        }
      },
      {
        // Only keep guests who booked more than once
        $match: {
          bookingCount: { $gt: 1 }
        }
      },
      {
        // Optional: sort by most frequent repeat guests
        $sort: { bookingCount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      repeatGuestCount: result.length,
      repeatGuests: result
    });

  } catch (err) {
    next(new HttpError(`Failed to fetch repeat guests: ${err.message}`, 500));
  }
};



// Get total revenue per apartment (numberOfDays * price)
exports.getRevenuePerApartment = async (req, res, next) => {
  try {
    const result = await BookingModel.aggregate([
      {
        // Compute numberOfDays from checkIn/checkOut
        $project: {
          apartmentName: 1,
          numberOfDays: {
            $ceil: {
              $divide: [
                { $subtract: ['$checkOutDate', '$checkInDate'] },
                1000 * 60 * 60 * 24 // convert ms to days
              ]
            }
          },
          price: 1
        }
      },
      {
        // Compute totalAmount = numberOfDays * price
        $project: {
          apartmentName: 1,
          totalAmount: { $multiply: ['$numberOfDays', '$price'] }
        }
      },
      {
        // Group by apartment and sum total revenue
        $group: {
          _id: '$apartmentName',
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 }
        }
      },
      {
        // Sort descending by revenue
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      apartments: result
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate revenue per apartment: ${err.message}`, 500));
  }
};

//////////////////////////////////MARKET\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//top 5 products sold
exports.getTopProductsSold = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await StockLogModel.aggregate([
      {
        $match: {
          changeType: 'OUT',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalQuantitySold: { $sum: '$quantityChanged' }
        }
      },
      {
        $sort: { totalQuantitySold: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      },
      {
        $project: {
          _id: 0,
          productId: '$product._id',
          name: '$product.name',
          sku: '$product.sku',
          totalQuantitySold: 1
        }
      }
    ]);

    res.status(200).json({ success: true, topProducts: result });
  } catch (err) {
    next(new HttpError(`Failed to fetch top products: ${err.message}`, 500));
  }
};


//Revenue from product sale

exports.getProductSalesRevenue = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await StockLog.aggregate([
      {
        $match: {
          changeType: 'OUT',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          revenue: { $multiply: ['$quantityChanged', '$unitPrice'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' }
        }
      }
    ]);

    const totalRevenue = result[0]?.totalRevenue || 0;

    res.status(200).json({
      success: true,
      totalRevenue,
      start: startDate,
      end: endDate
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate product sales revenue: ${err.message}`, 500));
  }
};

//profit from product sale
exports.getProductProfit = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await StockLog.aggregate([
      {
        $match: {
          changeType: 'OUT',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          profitPerItem: { $subtract: ['$unitPrice', '$marketPrice'] },
          quantityChanged: 1
        }
      },
      {
        $project: {
          totalProfit: { $multiply: ['$profitPerItem', '$quantityChanged'] }
        }
      },
      {
        $group: {
          _id: null,
          totalProfit: { $sum: '$totalProfit' }
        }
      }
    ]);

    const totalProfit = result[0]?.totalProfit || 0;

    res.status(200).json({
      success: true,
      totalProfit,
      start: startDate,
      end: endDate
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate profit: ${err.message}`, 500));
  }
};

//Stock Turnover Rate How quickly products are selling out
exports.getStockTurnoverRate = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // 1. Total quantity sold during the period
    const salesResult = await StockLog.aggregate([
      {
        $match: {
          changeType: 'OUT',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalQuantitySold: { $sum: '$quantityChanged' }
        }
      }
    ]);

    const totalSold = salesResult[0]?.totalQuantitySold || 0;

    // 2. Average inventory quantity (approximate as current average)
    const inventoryResult = await Product.aggregate([
      {
        $group: {
          _id: null,
          avgInventory: { $avg: '$quantity' }
        }
      }
    ]);

    const avgInventory = inventoryResult[0]?.avgInventory || 0;

    const turnoverRate = avgInventory > 0 ? (totalSold / avgInventory).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      totalQuantitySold: totalSold,
      averageInventory: avgInventory,
      turnoverRate: parseFloat(turnoverRate),
      start: startDate,
      end: endDate
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate stock turnover rate: ${err.message}`, 500));
  }
};

//Low Stock Alerts
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$reorderLevel'] }
    });

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      lowStockProducts
    });
  } catch (err) {
    next(new HttpError(`Failed to fetch low stock alerts: ${err.message}`, 500));
  }
};



//Get total expenses
exports.getTotalExpenses = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const total = result[0]?.totalAmount || 0;

    res.status(200).json({
      success: true,
      totalExpenses: total,
      start: startDate,
      end: endDate
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate total expenses: ${err.message}`, 500));
  }
};


// total top 5 expenses made
exports.getTopExpenseTitles = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start and end dates are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const result = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$title',
          totalSpent: { $sum: '$amount' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      topTitles: result
    });
  } catch (err) {
    next(new HttpError(`Failed to fetch top expense titles: ${err.message}`, 500));
  }
};