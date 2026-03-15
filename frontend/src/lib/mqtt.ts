import mqtt from 'mqtt';

interface MQTTMessage {
  topic: string;
  payload: string;
  timestamp: Date;
}

interface SensorData {
  uuid: string;
  sensor_prefix: string;
  value: number;
  timestamp: Date;
}

class MQTTClient {
  private client: mqtt.MqttClient | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();
  private messageHandlers = new Map<string, (data: SensorData) => void>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        host: 'comsci2.srru.ac.th',
        port: 1883,
        username: 'cssrru',
        password: 'good2cu*99',
        clientId: 'iot-farm-frontend-' + Math.random().toString(16).substr(2, 8)
      };

      this.client = mqtt.connect(options);

      this.client.on('connect', () => {
        console.log('✅ MQTT Connected (Frontend)');
        this.isConnected = true;
        resolve();
      });

      this.client.on('error', (err) => {
        console.error('❌ MQTT Error:', err);
        this.isConnected = false;
        reject(err);
      });

      this.client.on('close', () => {
        console.log('🔌 MQTT Disconnected');
        this.isConnected = false;
      });

      this.client.on('message', (topic, payload) => {
        this.handleMessage(topic, payload);
      });
    });
  }

  private handleMessage(topic: string, payload: Buffer) {
    try {
      // Parse topic: farm/node/{uuid}/input/{sensor_prefix}
      const topicParts = topic.split('/');
      if (topicParts.length < 5) return;

      const [, , uuid, , sensorPrefix] = topicParts;
      const value = parseFloat(payload.toString());

      if (isNaN(value)) {
        console.warn('⚠️ Invalid numeric value received');
        return;
      }

      const sensorData: SensorData = {
        uuid,
        sensor_prefix: sensorPrefix,
        value,
        timestamp: new Date()
      };

      console.log(`📨 Received MQTT: ${topic} = ${value}`);

      // Notify all handlers for this device
      this.messageHandlers.forEach((handler, key) => {
        if (key === uuid || key === 'all') {
          handler(sensorData);
        }
      });
    } catch (error) {
      console.error('❌ Error handling MQTT message:', error);
    }
  }

  subscribeToDevice(uuid: string, callback: (data: SensorData) => void) {
    if (!this.isConnected) {
      console.warn('⚠️ MQTT not connected');
      return;
    }

    const topic = `farm/node/${uuid}/input/#`;
    
    if (!this.subscriptions.has(topic)) {
      this.client?.subscribe(topic, (err) => {
        if (err) {
          console.error('❌ Subscribe error:', err);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
          this.subscriptions.add(topic);
        }
      });
    }

    this.messageHandlers.set(uuid, callback);
  }

  subscribeToAllDevices(callback: (data: SensorData) => void) {
    this.messageHandlers.set('all', callback);
    
    if (!this.subscriptions.has('farm/node/+/input/#')) {
      this.client?.subscribe('farm/node/+/input/#', (err) => {
        if (err) {
          console.error('❌ Subscribe error:', err);
        } else {
          console.log('📡 Subscribed to all device topics');
          this.subscriptions.add('farm/node/+/input/#');
        }
      });
    }
  }

  unsubscribe(uuid: string) {
    this.messageHandlers.delete(uuid);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isConnected = false;
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

export const mqttClient = new MQTTClient();
export default mqttClient;
