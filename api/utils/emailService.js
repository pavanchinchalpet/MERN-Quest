const nodemailer = require("nodemailer");

/*
--------------------------------
EMAIL CONFIG
--------------------------------
*/

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/*
--------------------------------
SEND OTP EMAIL
--------------------------------
*/

const sendOtpEmail = async (email, otp) => {
  try {

    // For local dev without email set up, allow skipping actual email sending
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      if (process.env.ALLOW_DEV_OTP === "true") {
        console.log(`\n\n[DEV MODE] 📧 OTP for ${email}: ${otp}\n\n`);
        return true;
      }
      throw new Error("SMTP credentials are required or ALLOW_DEV_OTP=true");
    }

    const mailOptions = {
      from: `"MERN Quest" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP for Login",
      text: `Your One-Time Password is: ${otp}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
          <h2>MERN Quest Login</h2>
          <p>Your One-Time Password for login is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px; color: #333;">${otp}</h1>
          <p>Please enter this code in the app to proceed. This code will expire in 10 minutes.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);

    return true;

  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

module.exports = {
  sendOtpEmail
};
