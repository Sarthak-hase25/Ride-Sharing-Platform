const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const methodOverride = require('method-override');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Ride = require('./models/ride');


// Load environment variables
dotenv.config();

const app = express();

// LiveReload for development
if (process.env.NODE_ENV !== 'production') {
    const livereload = require("livereload");
    const connectLiveReload = require("connect-livereload");
    
    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch(path.join(__dirname, 'public'));
    liveReloadServer.watch(path.join(__dirname, 'views'));
    
    liveReloadServer.server.once("connection", () => {
        setTimeout(() => {
            liveReloadServer.refresh("/");
        }, 100);
    });
    
    app.use(connectLiveReload());
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

const MongoStore = require('connect-mongo');

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: (MongoStore.create || MongoStore.MongoStore.create)({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Make user available in all templates
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        name: req.session.userName
    } : null;
    next();
});

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const profileRoutes = require('./routes/profileRoutes');

app.get('/', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRides = await Ride.countDocuments();
        const allRides = await Ride.find();
        let totalMoneySaved = 0;
        allRides.forEach(ride => {
            totalMoneySaved += ride.price * (ride.passengers ? ride.passengers.length : 0);
        });

        res.render('pages/home', { 
            title: 'WayMate - Smart Ride Sharing',
            stats: {
                totalUsers,
                totalRides,
                totalMoneySaved
            }
        });
    } catch (error) {
        res.render('pages/home', { 
            title: 'WayMate - Smart Ride Sharing',
            stats: { totalUsers: 0, totalRides: 0, totalMoneySaved: 0 }
        });
    }
});

// API for user dashboard stats
app.get('/api/user-stats', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const offeredRides = await Ride.countDocuments({ driver: req.session.userId });
        const bookedRides = await Ride.countDocuments({ passengers: req.session.userId });
        
        const bookings = await Ride.find({ passengers: req.session.userId });
        let totalSaved = 0;
        bookings.forEach(ride => totalSaved += ride.price);

        res.json({
            offeredRides,
            bookedRides,
            totalSaved
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});
app.get('/api/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalRides = await Ride.countDocuments();
        const allRides = await Ride.find();
        let totalMoneySaved = 0;
        allRides.forEach(ride => {
            totalMoneySaved += ride.price * (ride.passengers ? ride.passengers.length : 0);
        });

        res.json({
            totalUsers,
            totalRides,
            totalMoneySaved
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

app.use('/', authRoutes);
app.use('/rides', rideRoutes);
app.use('/profile', profileRoutes);

app.get("/keep-alive",(req,res)=>{
    res.send("Keep Alive");
});

// Robust Keep-Alive (only if not in local development)
if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
    setInterval(()=>{
        const url = process.env.PING_URL || "https://ride-sharing-platform-fljk.onrender.com/keep-alive";
        if (typeof fetch === 'function') {
            fetch(url)
                .then(() => console.log("Pinged self to stay awake"))
                .catch((err)=> console.error("Ping failed", err));
        } else {
            const https = require('https');
            https.get(url, (res) => {
                console.log("Pinged self to stay awake - status:", res.statusCode);
            }).on('error', (err) => {
                console.error("Ping failed", err);
            });
        }
    }, 5 * 60 * 1000);
}

// 404 Handler
app.use((req, res) => {
    res.status(404).render('pages/404', { title: '404 - Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke! Please try again later.');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
