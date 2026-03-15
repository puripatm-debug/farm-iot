const mqtt = require('mqtt');
require('dotenv').config();

const client = mqtt.connect(process.env.MQTT_HOST, {
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS
});

client.on('connect', () => {
    console.log('✅ Connected to MQTT Broker: comsci2.srru.ac.th');
});

client.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err);
});

client.on('offline', () => {
    console.log('⚠️ MQTT Client Offline');
});

client.on('reconnect', () => {
    console.log('🔄 MQTT Client Reconnecting...');
});

module.exports = client;
