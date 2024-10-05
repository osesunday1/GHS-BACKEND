const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');

// Define the email sending function
exports.sendEmail = async (req, res) => {
  const { firstName, lastName, email, number, checkInDate, checkOutDate } = req.body; // Destructure the form data

  // Create a transporter object with SMTP details
  let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services (Outlook, Yahoo, etc.)
    auth: {
      user: process.env.FROM_EMAIL, // Your email address from environment variables
      pass: process.env.PASS,       // Your email password or app-specific password
    },
  });

  // Customize the subject and email content to reflect the reservation details
  let mailOptions = {
    from: process.env.FROM_EMAIL, // Sender address from environment variables
    to: process.env.FROM_EMAIL, // Your email address where you'd receive the form submissions
    subject: `New Reservation Request from ${firstName} ${lastName}`, // Subject for reservation request
    text: `Reservation Request Details:\n\n
           Name: ${firstName} ${lastName}\n
           Email: ${email}\n
           Phone Number: ${number}\n
           Check-In Date: ${checkInDate}\n
           Check-Out Date: ${checkOutDate}`,
    html: `
      <h3>New Reservation Request from ${firstName} ${lastName}</h3>
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone Number:</strong> ${number}</p>
      <p><strong>Check-In Date:</strong> ${checkInDate}</p>
      <p><strong>Check-Out Date:</strong> ${checkOutDate}</p>
    `,
  };

  try {
    // Send the email using Nodemailer
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'Reservation request sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error); // Log error
    res.status(500).json({ error: 'Failed to send reservation request' });
  }
};