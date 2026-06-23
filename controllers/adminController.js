const mongoose = require('mongoose');
const HttpError = require('../utils/httpError');
const BookingModel = require('../model/bookingsModel');
const StockLogModel= require('../model/StockLogModel');
const Expense = require('../model/expenseModel');
const ProductModel = require('../model/productModel')


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
    const { start, end } = req.query;

    if (!start || !end) {
      return next(new HttpError('Start and end dates are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return next(new HttpError('Invalid date format.', 400));
    }

    const result = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: { $gte: startDate },
          checkOutDate: { $lte: endDate }
        }
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guest',
          foreignField: '_id',
          as: 'guestInfo'
        }
      },
      {
        $unwind: '$guestInfo'
      },
      {
        $group: {
          _id: {
            firstName: '$guestInfo.firstName',
            lastName: '$guestInfo.lastName'
          },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $match: {
          bookingCount: { $gt: 1 }
        }
      },
      {
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
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start and end dates are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      return next(new HttpError('Invalid date format.', 400));
    }

    const result = await BookingModel.aggregate([
      {
        // Filter by date range
        $match: {
          checkInDate: { $gte: startDate },
          checkOutDate: { $lte: endDate }
        }
      },
      {
        // Compute numberOfDays and totalAmount
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
        $project: {
          apartmentName: 1,
          totalAmount: { $multiply: ['$numberOfDays', '$price'] }
        }
      },
      {
        // Group by apartment name
        $group: {
          _id: '$apartmentName',
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 }
        }
      },
      {
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

    const result = await StockLogModel.aggregate([
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

// Get stock turnover rate for each product and return top 5
exports.getTopProductStockTurnoverRates = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(new Date(end).setHours(23, 59, 59, 999));

    // 1. Get total quantity sold per product
    const sales = await StockLog.aggregate([
      {
        $match: {
          changeType: 'OUT',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$productId',
          totalSold: { $sum: '$quantityChanged' },
        },
      },
    ]);

    // 2. Get current inventory quantity for all products
    const products = await Product.find({}, 'name quantity');

    // 3. Merge sales and inventory, compute turnover
    const turnoverData = sales.map(sale => {
      const product = products.find(p => p._id.toString() === sale._id.toString());
      if (!product) return null;

      const avgInventory = product.quantity;
      const turnoverRate = avgInventory > 0 ? sale.totalSold / avgInventory : 0;

      return {
        productId: sale._id,
        name: product.name,
        totalSold: sale.totalSold,
        averageInventory: avgInventory,
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
      };
    }).filter(Boolean); // remove nulls

    // 4. Sort and get top 5
    const top5 = turnoverData
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      start: startDate,
      end: endDate,
      top5Products: top5,
    });
  } catch (err) {
    next(new HttpError(`Failed to calculate stock turnover rate: ${err.message}`, 500));
  }
};


//Low Stock Alerts
exports.getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await ProductModel.aggregate([
      {
        $match: {
          $expr: {
            $lte: ['$quantity', '$reorderLevel']
          }
        }
      },
      {
        $project: {
          name: 1,
          sku: 1,
          category: 1,
          quantity: 1,
          reorderLevel: 1,
          supplier: 1
        }
      },
      {
        $sort: { quantity: 1 } // optional: sort by lowest quantity
      }
    ]);

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      lowStockProducts
    });
  } catch (err) {
    next(new HttpError(`Failed to fetch low stock alerts: ${err.message}`, 500));
  }
};


// Booking status breakdown (upcoming / in / out) for date range
exports.getBookingStatusBreakdown = async (req, res, next) => {
  const { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start and end dates are required.', 400));
    }

    const startDate = new Date(start);
    const endDate = new Date(new Date(end).setHours(23, 59, 59, 999));
    const now = new Date();

    const result = await BookingModel.aggregate([
      {
        $match: {
          checkInDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          computedStatus: {
            $cond: [
              { $gt: ['$checkInDate', now] },
              'upcoming',
              { $cond: [{ $gt: [now, '$checkOutDate'] }, 'out', 'in'] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$computedStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = { upcoming: 0, in: 0, out: 0 };
    result.forEach(({ _id, count }) => {
      if (_id in statusMap) statusMap[_id] = count;
    });

    res.status(200).json({
      success: true,
      upcoming: statusMap.upcoming,
      in: statusMap.in,
      out: statusMap.out,
      total: statusMap.upcoming + statusMap.in + statusMap.out,
    });
  } catch (err) {
    next(new HttpError(`Failed to fetch booking status: ${err.message}`, 500));
  }
};


//Get total expenses
exports.getTotalExpenses = async (req, res, next) => {
  let { start, end } = req.query;

  try {
    if (!start || !end) {
      return next(new HttpError('Start date and end date are required.', 400));
    }

    let startDate = new Date(start);
    let endDate = new Date(new Date(end).setHours(23, 59, 59, 999)); // end of day

    // Swap dates if in wrong order
    if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
    }

    // Total amount
    const totalAgg = await Expense.aggregate([
      {
        $match: { date: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const total = totalAgg[0]?.totalAmount || 0;

    // Breakdown by title
    const breakdownAgg = await Expense.aggregate([
      {
        $match: { date: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: '$title',
          amount: { $sum: '$amount' }
        }
      },
      {
        $sort: { amount: -1 } // Optional: sort descending
      }
    ]);

    const breakdown = breakdownAgg.map(item => ({
      title: item._id,
      amount: item.amount
    }));

    res.status(200).json({
      success: true,
      totalExpenses: total,
      start: startDate,
      end: endDate,
      breakdown
    });

  } catch (err) {
    next(new HttpError(`Failed to calculate total expenses: ${err.message}`, 500));
  }
};

