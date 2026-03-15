const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import MQTT service
const mqttService = require('./services/mqttService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - Manual CORS headers (Express 5 compatible)
app.use((req, res, next) => {
    console.log(`➡️ [${new Date().toISOString()}] ${req.method} ${req.url}`);
    res.on('finish', () => {
        console.log(`⬅️ [${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode}`);
    });
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(express.json());

// Start MQTT connection (with error handling)
try {
    mqttService.connect();
} catch (error) {
    console.log('⚠️ MQTT connection failed, but API server continues to run');
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'IoT Farm Management API Server is running!' });
});

// Import routes
const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farm');
const deviceRoutes = require('./routes/device');
const iotRoutes = require('./routes/iot');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/iot', iotRoutes);

// Only listen when running directly (not on Vercel)
if (process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
