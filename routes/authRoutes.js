const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest, isAuthenticated } = require('../middleware/auth');
const Ride = require('../models/ride');

// Signup routes
router.get('/signup', isGuest, authController.showSignup);
router.post('/signup', isGuest, authController.signup);

// Login routes
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, authController.login);

// Logout route
router.get('/logout', authController.logout);

// Dashboard route with stats
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const offeredRides = await Ride.countDocuments({ driver: req.session.userId });
        const bookedRides = await Ride.countDocuments({ passengers: req.session.userId });
        
        // Calculate real savings
        const bookings = await Ride.find({ passengers: req.session.userId });
        let totalSaved = 0;
        bookings.forEach(ride => totalSaved += ride.price);
        
        res.render('pages/dashboard', { 
            title: 'Dashboard',
            offeredRides,
            bookedRides,
            totalSaved
        });
    } catch (error) {
        res.render('pages/dashboard', { 
            title: 'Dashboard',
            offeredRides: 0,
            bookedRides: 0,
            totalSaved: 0
        });
    }
});

module.exports = router;