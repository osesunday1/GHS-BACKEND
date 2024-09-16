const crypto = require('crypto');
const {promisify} = require('util');
const jwt = require('jsonwebtoken')
const UserModel = require('./../model/userModel');
const HttpError = require('../utils/httpError');
const sendEmail = require('../utils/email');



const signToken = (id) => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN, // Ensure this matches your intent
    });
}; 

const createSendToken = (user, statusCode, res)=>{
    const token = signToken(user)

            res.status(statusCode).json({
                status: 'success',
                token,
                data:{
                    user
                }
            })
}

exports.signup= async(req, res, next)=> {
    
        try{
            //const newUser= await UserModel.create(req.body);
            const newUser = await UserModel.create({
                name: req.body.name,
                email:req.body.email,
                role: req.body.role,
                password: req.body.password,
                passwordConfirm: req.body.passwordConfirm,
                passwordChangedAt: req.body.passwordChangedAt
            });

            createSendToken(newUser, 201, res)

            
        } catch(error){
            return next(new HttpError(`Problem creating user: ${error}`, 500));
        }
}

exports.login= async(req, res, next)=>{
    const {email, password}= req.body;

    //1) check if email and password exist
    if(!email || !password){
        return next(new HttpError(`please provide email and password`, 400));
    }

    try{

        //2) check if user exist && password is correct
        const user= await UserModel.findOne({email:email}).select('+password');


        if(!user || !(await user.correctPassword(password, user.password))){
            return next(new HttpError(`incorrect email or password`, 401));
        }
        //3) if everything is okay send token to client
        createSendToken(user, 200, res)


    }catch(err){
        return next(new HttpError(`Loggiing in failed: ${err.message}`, 400));
    }

}

exports.protect= async(req, res, next)=>{
    
            //1) getting token and check if its there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }

    if(!token){
        return next(new HttpError(`You are not logged in, please login to get access`, 401));
    }

    try{

            //2) Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
        console.log('Decoded JWT:', decoded);

            //3) check if user still exists
        const freshUser= await UserModel.findById(decoded.id)
        if(!freshUser){
            return next(new HttpError(`The owner of this token does no longer exist`, 401));
        }

        console.log('User password changed at:', freshUser.passwordChangedAt);

            //4) if user changed password after the token was issued
       if (freshUser.changedPasswordAfter(decoded.iat)){
        return next(new HttpError('User recently changed password! Please log in again.', 401));
       };

            //5) Grant access to protected route
        req.user = freshUser;
        next();

    }catch(err){
        return next(new HttpError(`Loggiing in failed: ${err.message}`, 400));
    }

}

exports.restrictTo = (...roles)=>{
    return (req, res, next) =>{
        //roles ['staff', 'admin'].  role='user'
        if(!roles.includes(req.user.role)){
            return next(new HttpError(`You do not have the permission to perform this action`, 403));
        }
        next();
    }
}



exports.forgotPassword= async (req, res, next)=>{
    let user;
    try{

        //1)get user based on posted email
        user = await UserModel.findOne({email: req.body.email})
        if(!user){
            return next(new HttpError(`There is no user with email address`, 404));
        }
        
        //2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({validateBeforeSave: false})
        
        //3) send it to users email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        const message = `Forgot your password? Submit a Patch request for your new password and password confirm to ${resetURL}\n If you didn't forget your password, please ignore this email!`

        await sendEmail({
            email:user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    }catch(err){
       // Reset the password reset fields
       if(user){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false }); // Save the changes
       }
      return next(new HttpError(`There was an error sending the email. Try again later: ${err}`, 500));
    }
}

exports.resetPassword= async(req, res, next)=>{
    try{
    //1)get user based on the token
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

    const user = await UserModel.findOne({
        passwordResetToken: hashedToken, 
        passwordResetExpires: {$gt: Date.now() } 
    });

    //2) if token has not expired, and ther is user, set new password
    if(!user){
        return next(new HttpError(`Token is invalid or has expired`, 400));
    }

    user.password= req.body.password
    user.passwordConfirm= req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined

    await user.save()
    //3), update changepasswordAt property for the user



    //4) Log the user in, JWT   
    createSendToken(user, 200, res)

    }catch(err){
        return next(new HttpError('Error resetting password. Please try again later.', 500));
    }
};


exports.updatePassword = async (req, res, next) =>{

    try{
        // 1) Get user from collection
        const user = await UserModel.findById(req.user.id).select('+password')
        
        //2) Check if posted current password is correct
        if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
            return next(new HttpError('Your current password is wrong', 401));
        }

        //3) If so, update password

        user.password= req.body.password;
        user.passwordConfirm= req.body.passwordConfirm;
        await user.save();
        
        //4) log user in, send jwt
        createSendToken(user, 200, res)
    }catch(err){
        return next(new HttpError(`password update Error: ${err}`, 401));
    }
}