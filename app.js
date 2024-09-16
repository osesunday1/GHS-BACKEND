const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const HttpError = require('./utils/httpError');
const bookingsRoutes = require('./routes/bookingsRoute');
const apartmentRoutes= require('./routes/apartmentsRoute');
const guestRoutes= require('./routes/guestRoute');
const adminRoutes= require('./routes/adminRoute');
const inventoryRoutes= require('./routes/inventoryRoute');
const consumptionRoutes= require('./routes/consumptionRoute');
const userRoutes= require('./routes/userRoutes')
const cors = require('cors');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Initialize database connection
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        console.log('connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
};

mongoose.connection.on("disconnected", () => {
    console.log("MongoDB Disconnected");
});

mongoose.connection.on("connected", () => {
    console.log("MongoDB Connected");
});

// Use routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/apartments', apartmentRoutes);
app.use('/api/v1/guests', guestRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/consumption', consumptionRoutes);


// If no route is found
app.use((req, res, next) => {
    return next(new HttpError('could not find route', 404));
});


// Error handling middleware
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || 'An unknown error occurred at backend' });
});


// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    connect();
    console.log(`App running on port ${port}...`);
});