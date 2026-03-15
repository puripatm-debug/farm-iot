const express = require('express');
const router = express.Router();
const iotController = require('../controllers/iotController');
const { authenticateToken } = require('../middlewares/auth');

// Get devices for a farm
router.get('/farms/:farm_id/devices', authenticateToken, iotController.getDevices);

// Get sensor data for a device
router.get('/devices/:device_uuid/sensor-data', authenticateToken, iotController.getSensorData);

// Send command to device
router.post('/devices/:device_uuid/command', authenticateToken, iotController.sendCommand);

// Get sensor types
router.get('/sensor-types', authenticateToken, iotController.getSensorTypes);

// Get auto rules for a farm
router.get('/farms/:farm_id/auto-rules', authenticateToken, iotController.getAutoRules);

module.exports = router;
