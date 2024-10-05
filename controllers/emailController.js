const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');

// Define the email sending function
exports.sendEmail = async (req, res) => {
  const { to, subject, text, html } = req.body; // Destructure the email data from the request body

  // Create a transporter object with SMTP details
  let transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other email services (Outlook, Yahoo, etc.)
    auth: {
      user: process.env.FROM_EMAIL, // Your email address from environment variables
      pass: process.env.PASS,       // Your email password or app-specific password
    },
  });

  // Set up the email message object
  let mailOptions = {
    from: process.env.FROM_EMAIL, // Sender address from environment variables
    to: to || 'ghsapartment@gmail.com', // Recipient email address (with fallback)
    subject: subject || 'Hello from Node.js', // Default subject if not provided
    text: text || 'This is a test email sent from a Node.js application.', // Default text
    html: html || '<b>This is a test email sent from a Node.js application.</b>', // Default HTML content
  };

  try {
    // Send the email using Nodemailer
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error); // Log error
    res.status(500).json({ error: 'Failed to send email' });
  }
};