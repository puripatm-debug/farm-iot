const db = require('../config/db');
const mqttService = require('../services/mqttService');

const iotController = {
    async getDevices(req, res) {
        try {
            const { farm_id } = req.params;
            const userId = req.user.user_id;

            // Verify user has access to this farm
            const farmAccess = await db.query(
                'SELECT 1 FROM user_farms WHERE user_id = ? AND farm_id = ? AND deleted_at IS NULL',
                [userId, farm_id]
            );

            if (farmAccess.length === 0) {
                return res.status(403).json({ error: 'Access denied to this farm' });
            }

            // Get devices for this farm
            const devices = await db.query(
                `SELECT id, uuid, description, status, unit, created_at, updated_at
                 FROM iot_devices
                 WHERE farm_id = ? AND deleted_at IS NULL`,
                [farm_id]
            );

            res.json(devices);
        } catch (error) {
            console.error('Get devices error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getSensorData(req, res) {
        try {
            const { device_uuid } = req.params;
            const { limit = 100 } = req.query;
            const userId = req.user.user_id;

            // Verify user has access to this device
            const deviceAccess = await db.query(
                `SELECT 1 FROM iot_devices id
                 JOIN farms f ON id.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE id.uuid = ? AND uf.user_id = ? AND id.deleted_at IS NULL`,
                [device_uuid, userId]
            );

            if (deviceAccess.length === 0) {
                return res.status(403).json({ error: 'Access denied to this device' });
            }

            // Get sensor data
            const sensorData = await db.query(
                `SELECT sd.id, sd.val, sd.created_at, st.type_name, st.unit
                 FROM sensor_data sd
                 JOIN sensor_types st ON sd.sensor_type_id = st.id
                 WHERE sd.uuid = ? AND sd.deleted_at IS NULL
                 ORDER BY sd.created_at DESC
                 LIMIT ?`,
                [device_uuid, parseInt(limit)]
            );

            res.json(sensorData);
        } catch (error) {
            console.error('Get sensor data error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async sendCommand(req, res) {
        try {
            const { device_uuid } = req.params;
            const { pin, val } = req.body;
            const userId = req.user.user_id;

            // Verify user has access to this device
            const deviceAccess = await db.query(
                `SELECT id FROM iot_devices
                 WHERE uuid = ? AND deleted_at IS NULL`,
                [device_uuid]
            );

            if (deviceAccess.length === 0) {
                return res.status(404).json({ error: 'Device not found' });
            }

            // Check farm access
            const farmAccess = await db.query(
                `SELECT 1 FROM iot_devices id
                 JOIN farms f ON id.farm_id = f.id
                 JOIN user_farms uf ON f.id = uf.farm_id
                 WHERE id.uuid = ? AND uf.user_id = ? AND id.deleted_at IS NULL`,
                [device_uuid, userId]
            );

            if (farmAccess.length === 0) {
                return res.status(403).json({ error: 'Access denied to this device' });
            }

            // Send command via MQTT
            const topic = `farm/node/${device_uuid}/output/${pin}`;
            const message = String(val);

            const success = mqttService.publish(topic, message);

            if (success !== false) {
                // Log command to database
                await db.query(
                    `INSERT INTO actuator_commands (uuid, actuator_prefix, pin, val, created_at, updated_at)
                     VALUES (?, 'ACT', ?, ?, NOW(), NOW())`,
                    [device_uuid, pin, val]
                );

                res.json({
                    message: 'Command sent successfully',
                    topic,
                    command: { pin, val }
                });
            } else {
                res.status(500).json({ error: 'Failed to send command: MQTT not connected' });
            }
        } catch (error) {
            console.error('Send command error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getSensorTypes(req, res) {
        try {
            const sensorTypes = await db.query(
                'SELECT id, type_name, unit, description FROM sensor_types WHERE deleted_at IS NULL'
            );

            res.json(sensorTypes);
        } catch (error) {
            console.error('Get sensor types error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async getAutoRules(req, res) {
        try {
            const { farm_id } = req.params;
            const userId = req.user.user_id;

            // Verify user has access to this farm
            const farmAccess = await db.query(
                'SELECT 1 FROM user_farms WHERE user_id = ? AND farm_id = ? AND deleted_at IS NULL',
                [userId, farm_id]
            );

            if (farmAccess.length === 0) {
                return res.status(403).json({ error: 'Access denied to this farm' });
            }

            // Get auto rules for this farm
            const rules = await db.query(
                `SELECT ar.id, ar.description, ar.operator, ar.threshold, 
                        ar.actuator_iot_device_uuid, ar.actuator_prefix, ar.actuator_pin, 
                        ar.actuator_command_val, ar.is_active, st.type_name, st.unit
                 FROM auto_rules ar
                 JOIN sensor_types st ON ar.sensor_type_id = st.id
                 WHERE ar.farm_id = ? AND ar.deleted_at IS NULL`,
                [farm_id]
            );

            res.json(rules);
        } catch (error) {
            console.error('Get auto rules error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = iotController;
