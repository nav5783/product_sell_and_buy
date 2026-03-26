const nodemailer = require('nodemailer');

const sendBookingEmail = async (userEmail, booking) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com', // ❌ REPLACE WITH YOUR GMAIL
        pass: 'xxxx xxxx xxxx xxxx'    // ❌ REPLACE WITH YOUR APP PASSWORD
      }
    });

    const mailOptions = {
      from: 'Tour Management <no-reply@tour.com>',
      to: userEmail,
      subject: `Booking Confirmed: ${booking.packageName} ✅`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #28a745;">Booking Confirmed!</h2>
          <p>Dear ${booking.fullName},</p>
          <p>Your trip to <strong>${booking.packageName}</strong> is successfully booked.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td><strong>Date:</strong></td><td>${new Date(booking.travelDate).toDateString()}</td></tr>
            <tr><td><strong>Travelers:</strong></td><td>${booking.members}</td></tr>
            <tr><td><strong>Total Paid:</strong></td><td>$${booking.totalAmount}</td></tr>
          </table>

          <p>A receipt has been generated in your dashboard.</p>
          <p>Safe Travels! ✈️</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}`);
  } catch (error) {
    console.error("Email Error:", error);
  }
};

module.exports = sendBookingEmail;