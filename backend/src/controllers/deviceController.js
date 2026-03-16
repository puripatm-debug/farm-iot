const db = require('../config/db');
const mqttService = require('../services/mqttService');

const deviceController = {
    async getDevices(req, res) {
        try {
            const userId = req.user.user_id;

            const devices = await db.query(
                `SELECT d.id, d.uuid, d.farm_id, d.description, d.status, d.device_type, d.created_at,
                        f.name as farm_name, f.status as farm_status
                 FROM iot_devices d
                 JOIN farms f ON d.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE uf.user_id = ? AND d.deleted_at IS NULL`,
                [userId]
            );

            res.json(devices);
        } catch (error) {
            console.error('Get devices error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async createDevice(req, res) {
        try {
            const { uuid, farm_id, description, device_type } = req.body;
            const userId = req.user.user_id;

            if (!uuid || !farm_id) {
                return res.status(400).json({ message: 'กรุณาระบุ UUID และ ID ฟาร์ม' });
            }

            // Verify farm ownership
            const farm = await db.query(
                `SELECT 1 FROM farms f
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE f.id = ? AND uf.user_id = ? AND f.deleted_at IS NULL`,
                [farm_id, userId]
            );

            if (farm.length === 0) {
                return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงฟาร์มนี้' });
            }

            // Check duplicate UUID
            const existing = await db.query(
                'SELECT id FROM iot_devices WHERE uuid = ? AND deleted_at IS NULL',
                [uuid]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'UUID นี้ถูกใช้งานแล้ว' });
            }

            const result = await db.query(
                'INSERT INTO iot_devices (uuid, farm_id, description, device_type, status, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
                [uuid, farm_id, description || null, device_type || 'sensor']
            );

            res.status(201).json({
                message: 'เพิ่มอุปกรณ์สำเร็จ',
                device_id: result.insertId
            });
        } catch (error) {
            console.error('Create device error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async sendCommand(req, res) {
        try {
            const { id } = req.params;
            const { actuator_prefix, val } = req.body;
            const userId = req.user.user_id;

            if (!actuator_prefix || !val) {
                return res.status(400).json({ message: 'กรุณาระบุ actuator_prefix และ val' });
            }

            // Get device UUID, farm status, and verify ownership
            const device = await db.query(
                `SELECT d.uuid, d.farm_id, f.status as farm_status, f.name as farm_name
                 FROM iot_devices d
                 JOIN farms f ON d.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE d.id = ? AND uf.user_id = ? AND d.deleted_at IS NULL`,
                [id, userId]
            );

            if (device.length === 0) {
                return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
            }

            // Block command if farm is suspended
            if (device[0].farm_status === 0) {
                return res.status(403).json({ message: `ไม่สามารถสั่งงานได้ — ฟาร์ม "${device[0].farm_name}" ถูกระงับการใช้งาน` });
            }

            const { uuid } = device[0];
            const topic = `farm/node/${uuid}/output/${actuator_prefix}`;

            // Send MQTT command
            try {
                await mqttService.sendCommand(uuid, actuator_prefix, val);
                res.json({
                    message: 'ส่งคำสั่งสำเร็จ',
                    topic,
                    uuid,
                    actuator_prefix,
                    val
                });
            } catch (mqttError) {
                console.error('MQTT send error:', mqttError);
                res.status(500).json({ message: 'ไม่สามารถส่งคำสั่งได้' });
            }
        } catch (error) {
            console.error('Send command error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async updateDevice(req, res) {
        try {
            const { id } = req.params;
            const { uuid, farm_id, description, device_type } = req.body;
            const userId = req.user.user_id;

            // Verify device ownership
            const device = await db.query(
                `SELECT d.id, d.uuid
                 FROM iot_devices d
                 JOIN farms f ON d.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE d.id = ? AND uf.user_id = ? AND d.deleted_at IS NULL`,
                [id, userId]
            );

            if (device.length === 0) {
                return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
            }

            // If UUID changed, check duplicate
            if (uuid && uuid !== device[0].uuid) {
                const existing = await db.query(
                    'SELECT id FROM iot_devices WHERE uuid = ? AND id != ? AND deleted_at IS NULL',
                    [uuid, id]
                );
                if (existing.length > 0) {
                    return res.status(400).json({ message: 'UUID นี้ถูกใช้งานแล้ว' });
                }
            }

            // If farm_id changed, verify new farm ownership
            if (farm_id) {
                const farm = await db.query(
                    `SELECT 1 FROM farms f
                     JOIN user_farms uf ON f.id = uf.farm_id
                     WHERE f.id = ? AND uf.user_id = ? AND f.deleted_at IS NULL`,
                    [farm_id, userId]
                );
                if (farm.length === 0) {
                    return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึงฟาร์มนี้' });
                }
            }

            await db.query(
                `UPDATE iot_devices SET uuid = ?, farm_id = ?, description = ?, device_type = ?, updated_at = NOW() WHERE id = ?`,
                [uuid || device[0].uuid, farm_id || device[0].farm_id, description || null, device_type || 'sensor', id]
            );

            res.json({ message: 'แก้ไขอุปกรณ์สำเร็จ' });
        } catch (error) {
            console.error('Update device error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async deleteDevice(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            // Verify device ownership
            const device = await db.query(
                `SELECT d.id
                 FROM iot_devices d
                 JOIN farms f ON d.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE d.id = ? AND uf.user_id = ? AND d.deleted_at IS NULL`,
                [id, userId]
            );

            if (device.length === 0) {
                return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
            }

            // Soft delete: append timestamp to uuid so the UNIQUE constraint allows re-adding the same uuid
            const now = new Date().toISOString().replace(/[^0-9]/g, '');
            await db.query(
                `UPDATE iot_devices SET deleted_at = NOW(), uuid = CONCAT(uuid, '_del_', ?) WHERE id = ?`,
                [now, id]
            );

            res.json({ message: 'ลบอุปกรณ์สำเร็จ' });
        } catch (error) {
            console.error('Delete device error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async getSensorData(req, res) {
        try {
            const { id: deviceId } = req.params;
            const userId = req.user.user_id;

            // Verify device ownership
            const device = await db.query(
                `SELECT d.uuid
                 FROM iot_devices d
                 JOIN farms f ON d.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE d.id = ? AND uf.user_id = ? AND d.deleted_at IS NULL`,
                [deviceId, userId]
            );

            if (device.length === 0) {
                return res.status(404).json({ message: 'ไม่พบอุปกรณ์' });
            }

            const { uuid } = device[0];

            // Get recent sensor data
            const sensorData = await db.query(
                `SELECT sensor_prefix, val, created_at
                 FROM sensor_data
                 WHERE uuid = ?
                 ORDER BY created_at DESC
                 LIMIT 50`,
                [uuid]
            );

            res.json(sensorData);
        } catch (error) {
            console.error('Get sensor data error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    }
};

module.exports = deviceController;
