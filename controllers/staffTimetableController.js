const Timetable = require('../model/staffTimetableModel');
const HttpError = require('../utils/httpError');




//Create a Timetable Entry for Cleaning
exports.createTimetable = async (req, res, next) => {
    const { staff, task, date } = req.body;
  
    try {
      
      const existingEntry = await Timetable.findOne({ staff, date });
       
      if (existingEntry) {
        return next(new HttpError('Task already assigned for this date.', 400));
        }

      const timetable = await Timetable.create({ staff, task, date });
  
      res.status(201).json({
        status: 'success',
        data: { timetable }
      });
    } catch (err) {
      next(new HttpError(`Creating timetable failed: ${err.message}`, 500));
    }
  };

  //Get All Timetables (For Cleaning Tasks)
  exports.getAllTimetables = async (req, res, next) => {
    try {
      const timetables = await Timetable.find()
        .populate('staff', 'name role');  // Fetch only the staff's name and role
  
      res.status(200).json({
        status: 'success',
        count: timetables.length,
        data: timetables
      });
    } catch (err) {
      next(new HttpError(`Fetching timetables failed: ${err.message}`, 500));
    }
  };

  //Update a Timetable Entry
  exports.updateTimetable = async (req, res, next) => {
    try {
      const updatedTimetable = await Timetable.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
  
      if (!updatedTimetable) {
        return next(new HttpError('Timetable not found.', 404));
      }
  
      res.status(200).json({
        status: 'success',
        data: { timetable: updatedTimetable }
      });
    } catch (err) {
      next(new HttpError(`Updating timetable failed: ${err.message}`, 500));
    }
  };


  //Delete a Timetable Entry
  exports.deleteTimetable = async (req, res, next) => {
    try {
      const timetable = await Timetable.findByIdAndDelete(req.params.id);
  
      if (!timetable) {
        return next(new HttpError('Timetable not found.', 404));
      }
  
      res.status(204).json({
        status: 'success',
        message: 'Timetable deleted successfully',
      });
    } catch (err) {
      next(new HttpError(`Deleting timetable failed: ${err.message}`, 500));
    }
  };