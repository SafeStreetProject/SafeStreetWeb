const express = require('express');
const router = express.Router();
const User = require('../model/userschema'); // Assuming this is the correct path for your User model
const Photo = require('../model/photo'); // Import Photo model from models/photo.js
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createTokenForUser } = require('../services/authentication');

router.get('/signup', (req, res) => {
    return res.render("signup");
});

router.get('/signin', (req, res) => {
    return res.render("signin");
});

router.get("/index", (req, res) => {
    if (!req.user) {
        return res.redirect("/user/signin");
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

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.render('signin', { error: 'Incorrect Email or Password' });
        }

        console.log('User before token generation:', user); // Debug log
        const token = createTokenForUser(user);
        console.log('Generated token:', token); // Debug log
        return res.cookie('token', token).redirect("/user/index");
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

router.get("/dashboard", async (req, res) => {
    if (!req.user) {
        return res.redirect("/user/signin");
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized: Admin access required');
        }

        // Aggregate totalUploads, pendingIssues, and resolvedIssues across all users
        const aggregation = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUploads: { $sum: "$totalUploads" },
                    pendingIssues: { $sum: "$pendingIssues" },
                    resolvedIssues: { $sum: "$resolvedIssues" }
                }
            }
        ]);

        const result = aggregation.length > 0 ? aggregation[0] : { totalUploads: 0, pendingIssues: 0, resolvedIssues: 0 };

        // Fetch total photos for additional metrics (if needed)
        const totalPhotos = await Photo.countDocuments();
        const pendingPhotos = await Photo.countDocuments({ status: 'pending' });
        const resolvedPhotos = await Photo.countDocuments({ status: 'resolved' });

        res.render("dashboard", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.cookies.token, // Pass token for polling
            totalUploads: result.totalUploads || 0,
            pendingIssues: pendingPhotos || 0, // Use Photo collection for accuracy
            resolvedIssues: resolvedPhotos || 0,
            error: null
        });
    } catch (error) {
        console.error('Error in /dashboard:', error.message);
        res.render("dashboard", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.cookies.token,
            totalUploads: 0,
            pendingIssues: 0,
            resolvedIssues: 0,
            error: 'Failed to load dashboard data'
        });
    }
});

// GET /user/reports
router.get("/reports", async (req, res) => {
    if (!req.user) {
        console.log('Reports - No req.user, redirecting to /user/signin');
        return res.redirect("/user/signin");
    }
    try {
        if (req.user.role !== 'admin') {
            console.log('Reports - Unauthorized: User role is', req.user.role);
            return res.status(403).send('Unauthorized: Admin access required');
        }

        // Generate fresh token for API calls
        const token = createTokenForUser(req.user);
        console.log('Reports - Generated token:', token);

        res.render("reports", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: token,
            totalCases: 0,
            pendingCases: 0,
            completedCases: 0,
            inProgressCases: 0,
            casesLast30Days: Array(30).fill(0),
            recentReports: [],
            error: null
        });
    } catch (error) {
        console.error('Error in /reports:', error.message);
        res.render("reports", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.cookies.token || '',
            totalCases: 0,
            pendingCases: 0,
            completedCases: 0,
            inProgressCases: 0,
            casesLast30Days: Array(30).fill(0),
            recentReports: [],
            error: 'Failed to load report data'
        });
    }
});

// GET /api/get-reports (for polling)
router.get("/api/get-reports", async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const totalCases = await Photo.countDocuments();
        const pendingCases = await Photo.countDocuments({ status: 'pending' });
        const completedCases = await Photo.countDocuments({ status: 'resolved' });
        const inProgressCases = 0; // Adjust if you add an 'in-progress' status

        res.json({
            totalCases,
            pendingCases,
            completedCases,
            inProgressCases
        });
    } catch (error) {
        console.error('Error in /api/get-reports:', error.message);
        res.status(500).json({ error: 'Failed to fetch report data' });
    }
});

router.get("/map", async (req, res) => {
    if (!req.user) {
        console.log('Map - No req.user, redirecting to /user/signin');
        return res.redirect("/user/signin");
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            console.log('Map - Unauthorized: User role is', req.user.role);
            return res.status(403).render("map", {
                user: null,
                token: null,
                reportData: [],
                error: 'Unauthorized: Admin access required'
            });
        }

        // Fetch photos for all users where potholes are detected
        const photos = await Photo.find({ 'detectionResult.detected': true })
            .sort({ uploadDate: -1 })
            .lean();

        // Map over the array of photos to resolve uploader and format data
        const reportData = await Promise.all(photos.map(async (doc) => {
            const uploader = await User.findOne({ email: doc.userEmail }).select('FirstName');
            const uploadDate = new Date(doc.uploadDate);

            // Use reverse geocoding to get location
            const location = await getPlaceName(doc.latitude, doc.longitude);

            return {
                lat: doc.latitude || 0,
                lng: doc.longitude || 0,
                status: doc.status ? doc.status.toLowerCase() : 'pending',
                location: location || `${doc.latitude || 'Unknown'}, ${doc.longitude || 'Unknown'}`,
                date: uploadDate.toLocaleDateString(),
                name: uploader ? uploader.FirstName : 'Unknown'
            };
        }));

        // Render the map page with the token
        res.render("map", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.cookies.token || req.headers.authorization?.split(' ')[1] || '',
            reportData: reportData,
            error: null
        });
    } catch (error) {
        console.error('Error in /map:', error.message);
        res.render("map", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.cookies.token || req.headers.authorization?.split(' ')[1] || '',
            reportData: [],
            error: 'Failed to load map data'
        });
    }
});

router.get("/api/get-management-cases", async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        // Fetch all photos for all users
        const photos = await Photo.find()
            .sort({ uploadDate: -1 })
            .lean();

        // Map over the array of photos to resolve uploader and format data
        const cases = await Promise.all(photos.map(async (doc) => {
            const uploader = await User.findOne({ email: doc.userEmail });
            return {
                id: doc._id.toString(),
                severity: doc.status === 'pending' ? 'High' : 'Low', // Adjust severity logic as needed
                location: `${doc.latitude}, ${doc.longitude}`,
                uploader: uploader ? uploader.FirstName : 'Unknown',
                date: doc.uploadDate.toISOString().split('T')[0],
                image: doc.url || 'https://via.placeholder.com/300x150',
                assigned: doc.assigned || '',
                status: doc.status
            };
        }));

        res.json({
            success: true,
            data: { cases }
        });
    } catch (error) {
        console.error('Error in /api/get-management-cases:', error.message);
        res.status(500).json({ error: 'Failed to fetch case data' });
    }
});

router.get("/management", async (req, res) => {
    if (!req.user) {
        return res.redirect("/user/signin");
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            return res.status(403).send('Unauthorized: Admin access required');
        }

        // We'll fetch data dynamically via API, so pass an empty cases array
        res.render("management", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.token || req.cookies.token || req.headers.authorization?.split(' ')[1] || '', // Pass the token
            cases: [], // Empty array since we'll fetch dynamically
            error: null
        });
    } catch (error) {
        console.error('Error in /management:', error.message);
        res.render("management", {
            user: { FirstName: req.user.FirstName || 'Admin', email: req.user.email },
            token: req.token || req.cookies.token || req.headers.authorization?.split(' ')[1] || '',
            cases: [],
            error: 'Failed to load case data'
        });
    }
});

router.get("/help", (req, res) => {
    if (!req.user) {
        return res.redirect("/user/signin");
    }
    res.render("help", { user: req.user });
});

router.get("/changepassword", (req, res) => {
    if (!req.user) {
        return res.redirect("/user/signin");
    }
    res.render("changepassword", { user: req.user });
});

router.post("/api/update-case", async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        // Verify user role for authorities (admin)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized: Admin access required' });
        }

        const { caseId, assigned, status } = req.body;
        const updateData = { assigned, status };

        const photo = await Photo.findByIdAndUpdate(
            caseId,
            { $set: updateData },
            { new: true }
        );

        if (!photo) {
            return res.status(404).json({ error: 'Case not found' });
        }

        res.json({ message: 'Case updated successfully' });
    } catch (error) {
        console.error('Error in /api/update-case:', error.message);
        res.status(500).json({ error: 'Failed to update case' });
    }
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
            email: email.toLowerCase(),
            password: hashedPassword,
            totalUploads: 0,
            idNumber: email.toLowerCase(),
            role: email.toLowerCase().includes('admin') ? 'admin' : 'user' // Example role assignment
        });

        return res.redirect('/user/signin');
    } catch (error) {
        console.error("Signup Error:", error);
        return res.render('signup', {
            error: 'Something went wrong! Please try again later.',
        });
    }
});

module.exports = router;