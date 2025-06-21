const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const HttpError = require('./utils/httpError');
const bookingsRoutes = require('./routes/bookingsRoute');
const apartmentRoutes= require('./routes/apartmentsRoute');
const guestRoutes= require('./routes/guestRoute');
const adminRoutes= require('./routes/adminRoute');
const productRoutes= require('./routes/productRoute');
const stockRoutes = require('./routes/stockRoutes');
const expenseRoutes = require('./routes/expenseRoute');
const userRoutes= require('./routes/userRoutes')
const emailRoutes = require('./routes/emailRoute');  // Add the email route here
const cors = require('cors');

dotenv.config();

const app = express();

const allowedOrigins = [
  'https://ghsapt.com',
  'https://your-custom-domain.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// Initialize database connection
const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO);
        //await mongoose.connection.collection('guests').dropIndex('email_1');
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

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the GHS Apartment API!');
});


// Use routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/apartments', apartmentRoutes);
app.use('/api/v1/guests', guestRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/email', emailRoutes);


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
    res.json({ message: error.message || 'An unknown error occurred at backend'});
});


// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    connect();
    console.log(`App running on port ${port}...`);
});