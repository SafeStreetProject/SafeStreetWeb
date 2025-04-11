const express = require('express');
const router = express.Router();
const User = require('../model/userschema');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { createTokenForUser } = require('../services/authentication');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.resolve(`./uploads/${req.user._id}`);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const fileName =` ${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

router.get('/signup', (req, res) => {
  return res.render("signup");
});

router.get('/signin', (req, res) => {
  return res.render("signin");
});



router.get("/index", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("index", { user: req.user });
});

router.post('/signin', async (req, res) => {
  try {
    const { ID, password } = req.body;
    const user = await User.findOne({ idNumber: ID.toLowerCase() });

    if (!user) {
      return res.render('signin', { error: 'Incorrect UserID or Password' });
    }

    console.log("Stored Password in DB:", user.password);
    console.log("Entered Password:", password);
    // const hashpassword = await bcrypt.hash("Kmit123$", 10);
    // console.log("signin hashed: ",hashpassword);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    // const storedHash = '$2b$10$V6xrwVs8UuyW6kx4gL.elOgkP6jA6GLd6xtcPVC19sotCY7N3CDWe';
    // const enteredPassword = 'Kmit123$';

    // bcrypt.compare(enteredPassword, storedHash, (err, result) => {
    //   if (err) console.error(err);
    //   console.log("Does Kmit123$ match the stored hash?", result); // Will print false
    // });
    if (!isPasswordValid) {
      console.log("Invalid password");
      return res.render('signin', { error: 'Incorrect Email or Password' });
    }

    console.log("Password Matched");
    const token = createTokenForUser(user);
    return res.cookie('token', token).redirect("index");

  } catch (error) {
    console.error("Signin Error:", error);
    return res.render('signin', {
      error: 'Something went wrong, please try again.',
    });
  }
});


router.get('/logout', (req, res) => {
 return res.clearCookie("token").redirect('/');
});
router.get("/dashboard", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("dashboard", { user: req.user });
});
router.get("/reports", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("reports", { user: req.user });
});
router.get("/map", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("map", { user: req.user });
});
router.get("/management", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("management", { user: req.user });
});
router.get("/help", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("help", { user: req.user });
});
router.get("/changepassword", (req, res) => {
  if (!req.user) {
      return res.redirect("/login"); // Redirect if not logged in
  }
  res.render("changepassword", { user: req.user });
});
router.get('/upload', (req, res) => {
  res.render('upload', {
    user: req.user,
  });
});

router.post('/signup', async (req, res) => {
  const { FirstName, LastName, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.render('signup', { error: 'Email already registered! Try signing in.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password.trim(), saltRounds);

    await User.create({
      FirstName,
      LastName,
      email: email.toLowerCase(), // Convert to lowercase for case-insensitivity
      password: hashedPassword,
    });

    console.log("User successfully registered:", email);
    return res.redirect('/user/signin');

  } catch (error) {
    console.error("Signup Error:", error);
    return res.render('signup', {
      error: 'Something went wrong! Please try again later.',
    });
  }
});

router.post('/upload', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const flaskURL = 'http://localhost:5000/predict';
    const response = await axios.post(flaskURL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Content-Type': 'multipart/form-data',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Always clean up the uploaded file
    fs.unlinkSync(req.file.path);

    // Handle the response from the Flask backend
    const data = response.data;

    if (data.error) {
      return res.status(400).json({ error: data.error });
    }

    // Simplified response structure
    const result = {
      status: data.status,
      confidence: data.confidence
    };

    if (data.status === 'diseased') {
      result.disease = data.disease;
    }

    return res.json(result);

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);

    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    if (error.response && error.response.status === 400) {
      return res.status(400).json({
        error: 'The uploaded image could not be processed',
        details: error.response.data
      });
    }

    return res.status(500).json({ error: 'Prediction failed', details: error.message });
  }
});


module.exports = router;