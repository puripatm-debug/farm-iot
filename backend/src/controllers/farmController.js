const db = require('../config/db');

const farmController = {
    async getFarms(req, res) {
        try {
            const userId = req.user.user_id;
            
            const farms = await db.query(
                `SELECT f.id, f.name, f.description, f.lat, f.lng, f.size, f.farm_prefix, f.status,
                        fc.cat_name, f.created_at, f.updated_at
                 FROM farms f
                 LEFT JOIN farm_categories fc ON f.farm_category_id = fc.id
                 LEFT JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE uf.user_id = ? AND f.deleted_at IS NULL`,
                [userId]
            );

            res.json(farms);
        } catch (error) {
            console.error('Get farms error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async createFarm(req, res) {
        try {
            const { name, description, lat, lng, size, farm_category_id } = req.body;
            const userId = req.user.user_id;

            if (!name) {
                return res.status(400).json({ message: 'กรุณาระบุชื่อฟาร์ม' });
            }

            // Create farm
            const result = await db.query(
                `INSERT INTO farms (name, description, lat, lng, size, farm_category_id, farm_prefix, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, CONCAT('FARM_', DATE_FORMAT(NOW(), '%Y%m%d')), NOW(), NOW())`,
                [name, description || null, lat || null, lng || null, size || null, farm_category_id || 1]
            );

            const farmId = result.insertId;

            // Assign farm to user
            await db.query(
                'INSERT INTO user_farms (user_id, farm_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
                [userId, farmId]
            );

            res.status(201).json({
                message: 'สร้างฟาร์มสำเร็จ',
                farm_id: farmId
            });
        } catch (error) {
            console.error('Create farm error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async updateFarm(req, res) {
        try {
            const { id } = req.params;
            const { name, description, lat, lng, size, farm_category_id } = req.body;
            const userId = req.user.user_id;

            // Check if user has access to this farm
            const farmAccess = await db.query(
                `SELECT 1 FROM farms f
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE f.id = ? AND uf.user_id = ? AND f.deleted_at IS NULL`,
                [id, userId]
            );

            if (farmAccess.length === 0) {
                return res.status(404).json({ message: 'ไม่พบฟาร์ม' });
            }

            const result = await db.query(
                `UPDATE farms SET name = ?, description = ?, lat = ?, lng = ?, size = ?, farm_category_id = ?, updated_at = NOW()
                 WHERE id = ?`,
                [name, description || null, lat || null, lng || null, size || null, farm_category_id || 1, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'ไม่พบฟาร์ม' });
            }

            res.json({ message: 'อัปเดตฟาร์มสำเร็จ' });
        } catch (error) {
            console.error('Update farm error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async deleteFarm(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // Check if user has access to this farm
            const farmAccess = await db.query(
                `SELECT 1 FROM farms f
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE f.id = ? AND uf.user_id = ? AND f.deleted_at IS NULL`,
                [id, userId]
            );

            if (farmAccess.length === 0) {
                return res.status(404).json({ message: 'ไม่พบฟาร์ม' });
            }

            const result = await db.query(
                'UPDATE farms SET deleted_at = NOW() WHERE id = ?',
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'ไม่พบฟาร์ม' });
            }

            res.json({ message: 'ลบฟาร์มสำเร็จ' });
        } catch (error) {
            console.error('Delete farm error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async toggleFarmStatus(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const farmAccess = await db.query(
                `SELECT f.status FROM farms f
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE f.id = ? AND uf.user_id = ? AND f.deleted_at IS NULL`,
                [id, userId]
            );

            if (farmAccess.length === 0) {
                return res.status(404).json({ message: 'ไม่พบฟาร์ม' });
            }

            const newStatus = farmAccess[0].status === 1 ? 0 : 1;
            await db.query(
                'UPDATE farms SET status = ?, updated_at = NOW() WHERE id = ?',
                [newStatus, id]
            );

            res.json({
                message: newStatus === 1 ? 'เปิดใช้งานฟาร์มสำเร็จ' : 'ระงับฟาร์มสำเร็จ',
                status: newStatus
            });
        } catch (error) {
            console.error('Toggle farm status error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async getFarmCategories(req, res) {
        try {
            const categories = await db.query(
                'SELECT id, cat_name FROM farm_categories WHERE deleted_at IS NULL'
            );

            res.json(categories);
        } catch (error) {
            console.error('Get farm categories error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    }
};

module.exports = farmController;
