const Ride = require('../models/ride')

// Show create ride form
exports.showCreateRide = (req, res) => {
    res.render('pages/create-ride', {
        title: 'Offer a Ride',
        error: null
    });
};

// Create a new ride
exports.createRide = async (req, res) => {
    try {
        const { from, to, date, time, seats, price, vehicleType, vehicleNumber, notes } = req.body;

        const ride = await Ride.create({
            driver: req.session.userId,
            from,
            to,
            date,
            time,
            seats,
            price,
            vehicleType,
            vehicleNumber,
            notes
        });

        res.redirect('/rides');
    } catch (error) {
        res.render('pages/create-ride', {
            title: 'Offer a Ride',
            error: error.message
        });
    }
};



// Show ride details
exports.showRideDetails = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id)
            .populate('driver', 'name email phone college')
            .populate('passengers', 'name');

        if (!ride) {
            return res.redirect('/rides');
        }

        // Check if expired
        const now = new Date();
        const rideDate = new Date(ride.date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const rideDateOnly = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate());
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const isExpired = rideDateOnly < today || (rideDateOnly.getTime() === today.getTime() && ride.time < currentTime);

        res.render('pages/ride-details', {
            title: 'Ride Details',
            ride,
            isExpired
        });
    } catch (error) {
        res.redirect('/rides');
    }
};

// Book a ride
exports.bookRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.redirect('/rides');
        }

        // Check if ride has expired
        const now = new Date();
        const rideDate = new Date(ride.date);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const rideDateOnly = new Date(rideDate.getFullYear(), rideDate.getMonth(), rideDate.getDate());
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        if (rideDateOnly < today || (rideDateOnly.getTime() === today.getTime() && ride.time < currentTime)) {
            return res.redirect('/rides');
        }

        // Check if user is the driver
        if (ride.driver.toString() === req.session.userId) {
            return res.redirect(`/rides/${ride._id}`);
        }

        // Check if already booked
        if (ride.passengers.includes(req.session.userId)) {
            return res.redirect(`/rides/${ride._id}`);
        }

        // Check if seats available
        if (ride.passengers.length >= ride.seats) {
            return res.redirect(`/rides/${ride._id}`);
        }

        // Add passenger
        ride.passengers.push(req.session.userId);
        await ride.save();

        res.redirect(`/rides/${ride._id}`);
    } catch (error) {
        res.redirect('/rides');
    }
};

// Show user's offered rides
exports.myRides = async (req, res) => {
    try {
        const rides = await Ride.find({ driver: req.session.userId })
            .populate('passengers', 'name email phone')
            .sort({ date: -1 });

        res.render('pages/my-rides', {
            title: 'My Rides',
            rides
        });
    } catch (error) {
        res.render('pages/my-rides', {
            title: 'My Rides',
            rides: [],
            error: error.message
        });
    }
};

// Show user's bookings
exports.myBookings = async (req, res) => {
    try {
        const rides = await Ride.find({ 
            passengers: req.session.userId,
            status: 'active'
        })
            .populate('driver', 'name email phone college')
            .sort({ date: 1 });

        res.render('pages/my-bookings', {
            title: 'My Bookings',
            rides
        });
    } catch (error) {
        res.render('pages/my-bookings', {
            title: 'My Bookings',
            rides: [],
            error: error.message
        });
    }
};

// Cancel a ride (driver only)
exports.cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.redirect('/rides/my-rides');
        }

        // Check if user is the driver
        if (ride.driver.toString() !== req.session.userId) {
            return res.redirect('/rides/my-rides');
        }

        ride.status = 'cancelled';
        await ride.save();

        res.redirect('/rides/my-rides');
    } catch (error) {
        res.redirect('/rides/my-rides');
    }
};

// Cancel a booking (passenger)
exports.cancelBooking = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (!ride) {
            return res.redirect('/rides/my-bookings');
        }

        // Remove passenger from ride
        ride.passengers = ride.passengers.filter(
            p => p.toString() !== req.session.userId
        );
        await ride.save();

        res.redirect('/rides/my-bookings');
    } catch (error) {
        res.redirect('/rides/my-bookings');
    }
};

// List all active rides with search and filter
exports.listRides = async (req, res) => {
    try {
        const { from, to, date } = req.query;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        // Build query
        let query = { 
            status: 'active',
            $or: [
                { date: { $gt: today } },
                { date: today, time: { $gte: currentTime } }
            ]
        };
        
        if (from) {
            query.from = { $regex: from, $options: 'i' }; // Case-insensitive search
        }
        
        if (to) {
            query.to = { $regex: to, $options: 'i' };
        }
        
        if (date) {
            const searchDate = new Date(date);
            const searchDateOnly = new Date(searchDate.getFullYear(), searchDate.getMonth(), searchDate.getDate());
            
            // Remove the default $or and apply specific date filter
            delete query.$or;
            query.date = searchDateOnly;

            // If searching for today, also filter by time
            if (searchDateOnly.getTime() === today.getTime()) {
                query.time = { $gte: currentTime };
            }
        }
        
        const rides = await Ride.find(query)
            .populate('driver', 'name college phone')
            .sort({ date: 1, time: 1 });

        res.render('pages/rides', {
            title: 'Find Rides',
            rides,
            filters: { from, to, date }
        });
    } catch (error) {
        res.render('pages/rides', {
            title: 'Find Rides',
            rides: [],
            filters: {},
            error: error.message
        });
    }
};