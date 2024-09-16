const nodemailer = require('nodemailer');





const sendEmail = async (options) => {
    // 1) Create a transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,   // Use Mailtrap host
        port: process.env.EMAIL_PORT,   // Use Mailtrap port
        auth: {
            user: process.env.EMAIL_USERNAME, // Mailtrap username
            pass: process.env.EMAIL_PASSWORD  // Mailtrap password
        }
    });

    // 2) Define email options
    const mailOptions = {
        from: 'GHS Apartments <ghs@gmail.com>',  // Sender address
        to: options.email,                       // List of receivers
        subject: options.subject,                // Subject line
        text: options.message                       // Plain text body
        //html: options.html                      // HTML body (if needed)
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;