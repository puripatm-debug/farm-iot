// Test MQTT Data Simulator
const mqtt = require('mqtt');

const options = {
  host: 'comsci2.srru.ac.th',
  port: 1883,
  username: 'cssrru',
  password: 'good2cu*99',
  clientId: 'test-simulator-' + Math.random().toString(16).substr(2, 8)
};

const client = mqtt.connect(options);

const devices = [
  'node001',
  'node002', 
  'node003'
];

const sensorTypes = [
  'temperature',
  'humidity',
  'light',
  'soil_moisture',
  'ph'
];

client.on('connect', () => {
  console.log('✅ Test MQTT Simulator Connected');
  
  // Start sending test data every 5 seconds
  setInterval(() => {
    devices.forEach(device => {
      sensorTypes.forEach(sensorType => {
        // Generate random sensor values
        let value;
        switch(sensorType) {
          case 'temperature':
            value = 20 + Math.random() * 15; // 20-35°C
            break;
          case 'humidity':
            value = 40 + Math.random() * 40; // 40-80%
            break;
          case 'light':
            value = Math.random() * 1000; // 0-1000 lux
            break;
          case 'soil_moisture':
            value = 20 + Math.random() * 60; // 20-80%
            break;
          case 'ph':
            value = 6 + Math.random() * 2; // 6-8 pH
            break;
          default:
            value = Math.random() * 100;
        }
        
        const topic = `farm/node/${device}/input/${sensorType}`;
        const payload = value.toFixed(2);
        
        client.publish(topic, payload, (err) => {
          if (err) {
            console.error('❌ Publish error:', err);
          } else {
            console.log(`📤 Sent: ${topic} = ${payload}`);
          }
        });
      });
    });
  }, 5000);
  
  console.log('🚀 Started sending test data every 5 seconds...');
  console.log('📡 Devices:', devices);
  console.log('🌡️  Sensor types:', sensorTypes);
});

client.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});

client.on('close', () => {
  console.log('🔌 MQTT Disconnected');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping MQTT simulator...');
  client.end();
  process.exit(0);
});

console.log('🔧 Starting MQTT Test Simulator...');
