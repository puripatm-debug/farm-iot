const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const authMiddleware = require('../middlewares/auth');

// Get all farms for the authenticated user
router.get('/', authMiddleware, farmController.getFarms);

// Create new farm
router.post('/', authMiddleware, farmController.createFarm);

// Update farm
router.put('/:id', authMiddleware, farmController.updateFarm);

// Toggle farm status (suspend/activate)
router.patch('/:id/status', authMiddleware, farmController.toggleFarmStatus);

// Delete farm
router.delete('/:id', authMiddleware, farmController.deleteFarm);

// Get farm categories
router.get('/categories', authMiddleware, farmController.getFarmCategories);

module.exports = router;
