const UserModel = require('../model/userModel');
const HttpError = require('../utils/httpError');

//function to filter object

const filterObj =(obj, ...allowedfields)=>{
  const newObject= {};
  Object.keys(obj).forEach(el=> {
    if(allowedfields.includes(el)) newObject[el] = obj[el]
  })
  return newObject;
}

// Controller function to retrieve all guests
exports.getAllUsers = async (req, res, next) => {
    try {
      // Retrieve all guests from the database
      const users = await UserModel.find();
  
      // Send the response with the guests data
      res.status(200).json({
        success: true,
        count: users.length,
        data: users
      });
    } catch (err) {
      // Pass the error to the error handling middleware
      return next(new HttpError(`Retrieving Users failed: ${err.message}`, 500));
    }
  };

  exports.updateMe = async(req, res, next)=>{
    
    try{
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm){
      return next(new HttpError('This route is not for password updates. Please use / update My Password.', 400));
    }

    //2)filtered out unwanted fields
    const filteredBody= filterObj(req.body, 'name', 'email');

    //3) update user document
    const updatedUser = await UserModel.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data:{
        user: updatedUser
      }
    });
    

  }catch(err){
    return next(new HttpError(`Updating your details failed: ${err.message}`, 500));
  }
  };


  exports.deleteMe = async(req, res, next)=>{
    try{
      await UserModel.findByIdAndUpdate(req.user.id, {active: false})

      res.status(200).json({
        status: 'success',
        data: null
      })
    }catch(err){
      return next(new HttpError(`Deleting User failed: ${err.message}`, 500));
    }
  }