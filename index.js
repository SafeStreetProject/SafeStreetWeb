require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');

const { checkForAuthenticationCookie } = require('./middleware/authentication');
const userRouter = require('./routes/user');
const forgotRouter = require('./routes/forgotpassword');
const authRouter = require('./routes/auth');

const PORT = process.env.PORT || 8002;
const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// Log MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// App Configuration
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

app.use(session({
    secret: process.env.JWT_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/user', userRouter);
app.use('/user', forgotRouter);
app.use(authRouter);
app.get('/', (req, res) => {
    return res.render("home");
  });
// Start the server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
