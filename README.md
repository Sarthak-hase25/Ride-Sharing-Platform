# 🚗 WayMate - Community Transit Network

A modern web platform for local communities and workplaces to share rides, save costs, and connect. WayMate makes every journey more social and sustainable by connecting people heading in the same direction.

## ✨ Key Features

- **Modern Dashboard**: Track your shared trips and savings in real-time.
- **Dynamic Search**: Find rides by location, destination, and date.
- **Instant Booking**: Secure your seat with a single click.
- **Real-time Sync**: Live updates for available seats and ride counts.
- **Smart Expiry**: Automated cleanup of past rides to keep listings fresh.
- **Premium UI**: Responsive design with high-quality dual-tone iconography.

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: EJS, Tailwind CSS, Iconify
- **Authentication**: JWT & Cookie-based sessions

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sarthak-hase25/college-ride-share.git
   cd college-ride-share
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the application**:
   ```bash
   # For production
   npm start

   # For development (with hot reload)
   npm run dev
   ```

5. **Access the platform**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── controllers/    # Business logic & route handlers
├── models/         # MongoDB/Mongoose schemas
├── routes/         # Express router definitions
├── views/          # EJS templates & partials
├── middleware/     # Auth & validation middleware
└── server.js       # Main entry point
```

## 📜 License

This project is open-source and available under the MIT License.
