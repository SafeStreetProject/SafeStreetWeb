// require('dotenv').config();
// const debug = require('debug')('app:auth');
// const express = require('express');
// const router = express.Router();
// const passport = require('passport');
// const session = require('express-session');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const mongoose = require('mongoose');
// const app = express();
// const jwt=require('jsonwebtoken');
// const User=require('../model/google');

// // const userSchema = new mongoose.Schema({
// //     FirstName: { type: String, required: true },
// //     LastName: { type: String, required: true },
// //     googleId: { type: String },
// //     email: { type: String, required: true, unique: true },
// //     salt: { type: String },
// //     password: { type: String, required: true },
// //     role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
// //     googleAccessToken: { type: String },
// //     googleRefreshToken: { type: String },
// //     customToken: { type: String },
// // }, { timestamps: true });



// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: 'http://localhost:8002/auth/google/callback'
// },
// async (accessToken, refreshToken, profile, done) => {
//     try {
//         console.log("Google Profile:", profile);

//         let user = await User.findOne({
//             $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
//         });

//         if (!user) {
//             user = await User.create({
//                 googleId: profile.id,
//                 FirstName: profile.name?.givenName || 'No Name',
//                 LastName: profile.name?.familyName || 'Provided',
//                 email: profile.emails[0].value,
//                 password: 'google-oauth-' + Math.random().toString(36).slice(-8), // Generate a random password
//                 role: "USER",
//                 googleAccessToken: accessToken,
//                 googleRefreshToken: refreshToken,
//             });
//         } else if (!user.googleId) {
//             user.googleId = profile.id;
//             user.googleAccessToken = accessToken;
//             user.googleRefreshToken = refreshToken;
//             await user.save();
//         }

//         // Create a custom token
//         const customToken = jwt.sign(
//             { userId: user._id, email: user.email },
//             process.env.JWT_SECRET_KEY,
//             { expiresIn: '1d' }
//         );

//         user.customToken = customToken;
//         await user.save();

//         return done(null, user);
//     } catch (err) {
//         console.error('Error during authentication:', err);
//         return done(err, null);
//     }
// }));
// passport.serializeUser((user, done) => done(null, user.id));

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await User.findById(id);
//         done(null, user);
//     } catch (err) {
//         done(err, null);
//     }
// });

// router.get('/auth/google', (req, res, next) => {
//     console.log("Redirecting to Google for authentication...");
//     next();
// }, passport.authenticate('google', { 
//     scope: ['profile', 'email'],
//     accessType: 'offline',
//     prompt: 'consent'
// }));

// router.get('/auth/google/callback', 
//   passport.authenticate('google', { 
//     failureRedirect: "/user/signin",
//     failureFlash: true
//   }),
//   (req, res) => {
//     if (req.user && req.user.customToken) {
//       res.cookie('token', req.user.customToken, { 
//         httpOnly: true, 
//         secure: process.env.NODE_ENV === 'production',
//         maxAge: 24 * 60 * 60 * 1000 // 1 day
//       });
//     }
//     res.redirect('/');
//   }
// );

// router.get('/logout', async (req, res) => {
//     if (!req.user) {
//       return res.redirect('/user/signin');
//     }
  
//     try {
//       const user = await User.findById(req.user._id);
//       if (!user) {
//         return res.status(404).json({ message: 'User not found' });
//       }
  
//       // Revoke Google token if it exists
//       if (user.googleAccessToken) {
//         const oauth2Client = new google.auth.OAuth2(
//           process.env.GOOGLE_CLIENT_ID,
//           process.env.GOOGLE_CLIENT_SECRET
//         );
//         oauth2Client.setCredentials({ access_token: user.googleAccessToken });
//         await oauth2Client.revokeToken(user.googleAccessToken);
//       }
//   console.log(token)
//       // Clear tokens from the user document
//       user.customToken = undefined;
//       user.googleAccessToken = undefined;
//       user.googleRefreshToken = undefined;
//       await user.save();
  
//       // Clear session and cookies
//       req.logout((err) => {
//         if (err) {
//           console.error('Error during logout:', err);
//           return res.status(500).json({ message: 'Error logging out' });
//         }
//         req.session.destroy((err) => {
//           if (err) {
//             console.error('Error destroying session:', err);
//             return res.status(500).json({ message: 'Error destroying session' });
//           }
//           res.clearCookie('connect.sid');
//           res.clearCookie('token');
//           res.redirect('/user/signin');
//         });
//       });
//     } catch (error) {
//       console.error('Error during logout:', error);
//       res.status(500).redirect('/user/signin');
//     }
//   });
  
  


// module.exports = router;
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/userschema");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { ID, password } = req.body;

  try {
    // 🔹 Convert ID to lowercase before querying the DB
    const user = await User.findOne({ idNumber: ID.toLowerCase() });

    if (!user) return res.status(401).json({ message: "Invalid ID or Password" });

    // 🔹 Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid ID or Password" });

    // 🔹 Generate JWT token
    const token = jwt.sign({ idNumber: user.idNumber }, process.env.JWT_SECRET_KEY, { expiresIn: "2h" });

    // 🔹 Set token in a cookie
    res.cookie("authToken", token, { httpOnly: true, secure: true });
    res.json({ message: "Login successful", token });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/change-password", async (req, res) => {
  const { ID, oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ idNumber: ID.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔹 Validate old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect old password" });

    // 🔹 Update password
    await user.updatePassword(newPassword);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
