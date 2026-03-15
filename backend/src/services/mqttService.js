const mqtt = require('mqtt');
const db = require('../config/db');
require('dotenv').config();

class MQTTService {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    connect() {
        const options = {
            host: process.env.MQTT_HOST,
            port: process.env.MQTT_PORT || 1883,
            username: process.env.MQTT_USER,
            password: process.env.MQTT_PASS,
            clientId: 'iot-farm-backend-' + Math.random().toString(16).substr(2, 8)
        };

        this.client = mqtt.connect(options);

        this.client.on('connect', () => {
            console.log('✅ MQTT Connected');
            this.isConnected = true;
            this.subscribeToTopics();
        });

        this.client.on('error', (err) => {
            console.error('❌ MQTT Error:', err);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            console.log('🔌 MQTT Disconnected');
            this.isConnected = false;
        });

        this.client.on('message', this.handleMessage.bind(this));
    }

    subscribeToTopics() {
        // Subscribe to all node input topics
        this.client.subscribe('farm/node/+/input/#', (err) => {
            if (err) {
                console.error('❌ Subscribe error:', err);
            } else {
                console.log('📡 Subscribed to farm/node/+/input/#');
            }
        });
    }

    async handleMessage(topic, payload) {
        try {
            console.log(`📨 Received message: ${topic} - ${payload}`);

            // Parse topic: farm/node/{uuid}/input/{sensor_prefix}
            const topicParts = topic.split('/');
            if (topicParts.length < 5) return;

            const [, , uuid, , sensorPrefix] = topicParts;
            const value = parseFloat(payload.toString());

            if (isNaN(value)) {
                console.warn('⚠️ Invalid numeric value received');
                return;
            }

            // Check if device exists in database
            const device = await db.query(
                'SELECT id FROM iot_devices WHERE uuid = ? AND deleted_at IS NULL',
                [uuid]
            );

            if (device.length === 0) return;

            // Save to sensor_data table (with sensor_type_id)
            await db.query(
                'INSERT INTO sensor_data (uuid, sensor_prefix, val, sensor_type_id, created_at) VALUES (?, ?, ?, 1, NOW())',
                [uuid, sensorPrefix, value]
            );

            console.log(`💾 Saved sensor data: ${uuid} - ${sensorPrefix} - ${value}`);
        } catch (error) {
            console.error('❌ Error handling MQTT message:', error);
        }
    }

    publish(topic, message) {
        return new Promise((resolve, reject) => {
            // If already connected, use existing connection
            if (this.isConnected && this.client) {
                this.client.publish(topic, message, (err) => {
                    if (err) {
                        console.error('❌ Publish error:', err);
                        reject(err);
                    } else {
                        console.log(`📤 Published: ${topic} - ${message}`);
                        resolve(true);
                    }
                });
            } else {
                // Serverless: connect, publish, disconnect
                const tempClient = mqtt.connect({
                    host: process.env.MQTT_HOST,
                    port: process.env.MQTT_PORT || 1883,
                    username: process.env.MQTT_USER,
                    password: process.env.MQTT_PASS,
                    clientId: 'iot-farm-pub-' + Math.random().toString(16).substr(2, 8)
                });

                tempClient.on('connect', () => {
                    tempClient.publish(topic, message, (err) => {
                        tempClient.end();
                        if (err) {
                            console.error('❌ Publish error:', err);
                            reject(err);
                        } else {
                            console.log(`📤 Published (temp): ${topic} - ${message}`);
                            resolve(true);
                        }
                    });
                });

                tempClient.on('error', (err) => {
                    console.error('❌ Temp MQTT error:', err);
                    tempClient.end();
                    reject(err);
                });

                // Timeout after 10 seconds
                setTimeout(() => {
                    tempClient.end();
                    reject(new Error('MQTT connection timeout'));
                }, 10000);
            }
        });
    }

    sendCommand(uuid, actuatorPrefix, value) {
        const topic = `farm/node/${uuid}/output/${actuatorPrefix}`;
        return this.publish(topic, value);
    }
}

const mqttService = new MQTTService();
module.exports = mqttService;
