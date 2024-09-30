const crypto = require('crypto')
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt')

// name, email, photo, password, passwordConfirmation


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'please insert your name']
    },

    email: {
        type: String,
        required: [true, 'please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email']
    },

    photo: String,
    role:{
        type: String,
        enum: ['staff', 'admin'],
        default:'staff'
    },
    password:{
        type: String,
        required: [true, 'Please provide password'],
        minlength: 4,
        select: false
    },
    
    passwordConfirm:{
        type: String,
        required: [true, 'Please confirm your password'],
        validate:{
            //This only works on CREATE and save
            validator: function(el){
                return el ===this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken:String,
    passwordResetExpires:Date,
    active:{
        type: Boolean,
        default: true,
        select:false
    }
});

userSchema.pre('save', async function(next){
    //only run if password was actually modified
    if(!this.isModified('password')) return next();

    //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    //delete the passwordConfirm field
    this.passwordConfirm= undefined;
    this.passwordChangedAt = Date.now() - 1000; // Set the current time minus 1 second

    next();
});

userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000
    next();
});


userSchema.pre(/^find/, function(next) {
    //this points to the current querry
    this.find({active: {$ne: false} });
    next();
})

////compare password during login
userSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    //false means not changed

    return false
    }

userSchema.methods.createPasswordResetToken= function(){
     const resetToken=crypto.randomBytes(32).toString('hex');

     this.passwordResetToken = crypto
     .createHash('sha256')
     .update(resetToken)
     .digest('hex')

     //console.log({resetToken}, this.passwordResetToken)

     this.passwordResetExpires=Date.now() + 20 * 60 * 1000;

     return resetToken;
};



const User = mongoose.model('User', userSchema);

module.exports = User;