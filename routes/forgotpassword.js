const express = require('express');
const router = express.Router();
const User = require('../model/userschema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const validator = require('express-validator');

const otpStore = new Map(); // Temporary in-memory OTP store

// Render Forgot Password Page
router.get('/forgotpassword', (req, res) => {
  res.render('forgotpassword');
});

// Handle Forgot Password Request
router.post('/forgotpassword', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).render('forgotpassword', {
        error: 'Please provide an email address.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).render('forgotpassword', {
        error: 'User not found. Please register.',
      });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');

    // Store OTP with expiry
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    console.log('Generated OTP:', otp);
    console.log('Stored OTP:', otpStore.get(email).otp);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP Email
    await transporter.sendMail({
      from: `"Password Reset" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Password Reset OTP',
      html: `<p>Your OTP for password reset is <b>${otp}</b>. It is valid for 5 minutes.</p>`,
    });

    console.log(`OTP sent to ${email}: ${otp}`);

    res.render('otpverification', {
      email,
      message: 'OTP has been sent to your email. Please check your inbox.',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).render('forgotpassword', {
      error: 'An error occurred. Please try again later.',
    });
  }
});

// ... rest of the code remains unchanged
// ... previous code remains the same ...

// Handle OTP Verification
router.post('/otpverification', (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Received OTP:', otp); // Debug log

    const storedData = otpStore.get(email);
    console.log('Stored OTP:', storedData?.otp); // Debug log

    if (!storedData) {
      return res.status(400).render('otpverification', {
        email,
        error: 'No OTP request found. Please request a new OTP.',
      });
    }

    // Compare as strings without parseInt
    if (storedData.otp !== otp) {
      return res.status(400).render('otpverification', {
        email,
        error: 'Invalid OTP. Please try again.',
      });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).render('otpverification', {
        email,
        error: 'OTP has expired. Please request a new one.',
      });
    }

    // OTP is valid
    otpStore.delete(email);
    res.redirect(`/user/resetpassword?email=${email}`);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).render('otpverification', {
      email: req.body.email,
      error: 'An error occurred. Please try again later.',
    });
  }
});

// ... rest of the code remains the same ...


// Handle Reset Password Form Submission
router.post('/resetpassword', async (req, res) => {
  try {
    const { email, password1, password2 } = req.body;
    console.log("received body:", req.body);

    if (!email || !password1 || !password2) {
      return res.status(400).render('resetpassword', {
        email,
        error: 'All fields are required.',
      });
    }

    if (password1 !== password2) {
      return res.status(400).render('resetpassword', {
        email,
        error: 'Passwords do not match.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password1, 10);

    // Update the user's password in the database
    const updatedUser = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).render('resetpassword', {
        email,
        error: 'User not found.',
      });
    }

    console.log('Updated User Password:', updatedUser.password);

     res.render('signin', {
    // res.redirect('/user/signin',{
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).render('resetpassword', {
      email: req.body.email,
      error: 'An error occurred. Please try again later.',
    });
  }
});

router.get('/resetpassword', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).render('forgotpassword', {
      error: 'Email is required for password reset.',
    });
  }
  res.render('resetpassword', { email });
});


module.exports = router;

