const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const usersController = require('../controllers/usersController')


const {signup, login, forgotPassword, resetPassword, updatePassword} = authController;
const {getAllUsers, updateMe, deleteMe} = usersController;

router.post('/signup', signup)
router.post('/login', login)

router.post('/forgotPassword', forgotPassword)
router.patch('/resetPassword/:token', resetPassword)

router.patch('/updateMyPassword', authController.protect ,updatePassword)


router.get('/users', getAllUsers)


router.patch('/updateMe', authController.protect, updateMe)
router.delete('/deleteMe', authController.protect, deleteMe)


module.exports = router;