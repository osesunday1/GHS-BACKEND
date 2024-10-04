const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (req, res) => {
  const { firstName, lastName, email, number, checkInDate, checkOutDate } = req.body;

  const msg = {
    to: 'ghsapartment@gmail.com', // Your receiving email
    from: 'your-verified-email@example.com', // Replace with your verified sender email
    subject: 'New Booking Request',
    text: `First Name: ${firstName}
           Last Name: ${lastName}
           Email: ${email}
           Phone Number: ${number}
           Check-In Date: ${checkInDate}
           Check-Out Date: ${checkOutDate}`,
  };

  try {
    await sgMail.send(msg);
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

module.exports = { sendEmail };