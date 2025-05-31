// D:\safestreet\models\photo.js
const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
    userEmail: String,
    url: String,
    latitude: Number,
    longitude: Number,
    uploadDate: Date,
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    detectionResult: Object,
    assigned: { type: String, default: '' }, // Added for management route
    completionImage: { type: String, default: '' } // Added for management route
});

// Prevent model redefinition
const Photo = mongoose.models.Photo || mongoose.model('Photo', photoSchema);

module.exports = Photo;