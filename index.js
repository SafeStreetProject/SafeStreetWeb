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
// const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 8002;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost/safestreetApp')
    .then(() => console.log("MongoDB connected"))
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// Log MongoDB connection events
mongoose.connection.on('connected', () => console.log('Mongoose connected to MongoDB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// App Configuration
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(checkForAuthenticationCookie("token"));
app.use(session({
    secret: process.env.JWT_SECRET_KEY || 'safestreet',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/user', userRouter);
app.use('/user', forgotRouter);
// app.use('/api', apiRouter);
app.use(authRouter);

app.get('/', (req, res) => {
    return res.render("home");
});
function authenticateToken(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('authenticateToken - No token provided');
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('authenticateToken - Decoded token:', decoded);
        next();
    } catch (error) {
        console.error('authenticateToken - Invalid token:', error.message);
        req.user = null;
        next();
    }
}

// Reverse Geocoding Function
async function getPlaceName(latitude, longitude) {
    try {
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            console.error('getPlaceName - Invalid coordinates:', { latitude, longitude });
            return 'Unknown location';
        }

        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'SafeStreetApp/1.0 (safestreet2025@gmail.com)' },
            timeout: 5000
        });

        console.log('getPlaceName - Nominatim response:', response.data);
        if (response.data && response.data.display_name) {
            return response.data.display_name;
        }
        return 'Unknown location';
    } catch (error) {
        console.error('Error in reverse geocoding:', error.message);
        return 'Unknown location';
    }
}

global.getPlaceName = getPlaceName;
app.get('/api/get-map-reports', authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication token missing' });
    }

    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
        }

        const reports = await Photo.find({ 'detectionResult.detected': true })
            .sort({ uploadDate: -1 })
            .lean();

        const resolvedReports = await Promise.all(reports.map(async (doc) => {
            const uploader = await User.findOne({ email: doc.userEmail }).select('FirstName');
            const placeName = await getPlaceName(doc.latitude, doc.longitude);
            const uploadDate = new Date(doc.uploadDate);

            return {
                lat: doc.latitude,
                lng: doc.longitude,
                location: placeName,
                date: uploadDate.toLocaleDateString(),
                name: uploader ? uploader.FirstName : 'Unknown',
                status: doc.status || 'pending'
            };
        }));

        res.json({
            success: true,
            data: { reports: resolvedReports }
        });
    } catch (error) {
        console.error('Error in /api/get-map-reports:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch map reports' });
    }
});
app.get("/api/get-management-cases", async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const photos = await Photo.find()
            .sort({ uploadDate: -1 })
            .lean();
        console.log('Fetched photos for management:', photos);

        const cases = await Promise.all(photos.map(async (doc) => {
            const uploader = await User.findOne({ email: doc.userEmail });
            console.log('Uploader for photo', doc._id, ':', uploader);
            return {
                id: doc._id.toString(),
                severity: doc.status === 'pending' ? 'High' : 'Low',
                location: `${doc.latitude}, ${doc.longitude}`,
                uploader: uploader ? uploader.FirstName : 'Unknown',
                date: doc.uploadDate.toISOString().split('T')[0],
                image: doc.url || 'https://via.placeholder.com/300x150',
                assigned: doc.assigned || '',
                status: doc.status
            };
        }));

        console.log('Sending management cases:', cases);
        res.json({
            success: true,
            data: { cases }
        });
    } catch (error) {
        console.error('Error in /api/get-management-cases:', error.message);
        res.status(500).json({ error: 'Failed to fetch case data' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});