const express = require('express');
const router = express.Router();
const Photo = require('../model/photo');
const User = require('../model/userschema');

// Middleware to check authentication
const authenticate = async (req, res, next) => {
    if (!req.user) {
        console.log('API - No req.user, unauthorized');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    if (req.user.role !== 'admin') {
        console.log('API - Unauthorized: User role is', req.user.role);
        return res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
    }
    next();
};

// GET /api/get-report-stats
router.get('/get-report-stats', authenticate, async (req, res) => {
    try {
        const totalCases = await Photo.countDocuments();
        const pendingCases = await Photo.countDocuments({ status: 'pending' });
        const completedCases = await Photo.countDocuments({ status: 'resolved' });
        const inProgressCases = 0; // Adjust if 'in-progress' status is added

        res.json({
            success: true,
            data: {
                totalCases,
                pendingCases: totalCases, // As per reports.ejs requirement
                completedCases,
                inProgressCases
            }
        });
    } catch (error) {
        console.error('Error in /api/get-report-stats:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch report stats' });
    }
});

// GET /api/get-last-30-days
router.get('/get-last-30-days', authenticate, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyCounts = await Photo.aggregate([
            { $match: { uploadDate: { $gte: thirtyDaysAgo } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$uploadDate' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const casesLast30Days = Array(30).fill(0);
        dailyCounts.forEach(({ _id, count }) => {
            const index = Math.floor((new Date(_id) - thirtyDaysAgo) / (1000 * 60 * 60 * 24));
            if (index >= 0 && index < 30) casesLast30Days[index] = count;
        });

        res.json({
            success: true,
            data: { casesLast30Days }
        });
    } catch (error) {
        console.error('Error in /api/get-last-30-days:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch last 30 days data' });
    }
});

// GET /api/get-recent-reports
router.get('/get-recent-reports', authenticate, async (req, res) => {
    try {
        const recentReports = await Photo.find()
            .sort({ uploadDate: -1 })
            .limit(3)
            .lean();

        const resolvedReports = await Promise.all(recentReports.map(async (doc) => {
            const uploader = await User.findOne({ email: doc.userEmail });
            return {
                name: uploader ? uploader.FirstName : 'Unknown',
                location: `${doc.latitude || 'Unknown'}, ${doc.longitude || 'Unknown'}`,
                date: doc.uploadDate.toISOString().split('T')[0],
                severity: doc.status === 'pending' ? 'High' : 'Low',
                imageUrl: doc.url || 'https://via.placeholder.com/300x150'
            };
        }));

        res.json({
            success: true,
            data: { recentReports: resolvedReports }
        });
    } catch (error) {
        console.error('Error in /api/get-recent-reports:', error.message);
        res.status(500).json({ success: false, error: 'Failed to fetch recent reports' });
    }
});

module.exports = router;