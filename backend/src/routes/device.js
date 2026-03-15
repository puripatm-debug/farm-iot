const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const authMiddleware = require('../middlewares/auth');

// Get all devices for the authenticated user
router.get('/', authMiddleware, deviceController.getDevices);

// Create new device
router.post('/', authMiddleware, deviceController.createDevice);

// Update device
router.put('/:id', authMiddleware, deviceController.updateDevice);

// Delete device (soft delete)
router.delete('/:id', authMiddleware, deviceController.deleteDevice);

// Send command to device
router.post('/:id/command', authMiddleware, deviceController.sendCommand);

// Get sensor data for device
router.get('/:id/sensor-data', authMiddleware, deviceController.getSensorData);

module.exports = router;
