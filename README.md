# IoT Farm Management System

ระบบจัดการฟาร์มอัจฉริยะด้วยเทคโนโลยี IoT สำหรับการเกษตรแบบยั่งยืน

## 🌾 Features

- ✅ **ระบบสมาชิก** (Login/Register พร้อม JWT Authentication)
- ✅ **จัดการฟาร์ม** (เพิ่ม/แก้ไข/ลบฟาร์ม)
- ✅ **จัดการอุปกรณ์ IoT** (เพิ่ม/ควบคุม/ดูข้อมูลเซ็นเซอร์)
- ✅ **MQTT Communication** (ส่ง-รับข้อมูลจากอุปกรณ์)
- ✅ **Dashboard** (ภาพรวมระบบและสถิติ)
- ✅ **Responsive Design** (รองรับทุกขนาดหน้าจอ)

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MySQL** Database
- **JWT** (jsonwebtoken)
- **MQTT** (mqtt.js)
- **bcryptjs** (Password hashing)

### Frontend
- **Next.js** (React)
- **Bootstrap 5**
- **Axios** (HTTP Client)
- **js-cookie** (Token storage)
- **TypeScript**

## 📁 Project Structure

```
my-iot-farm/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express server
│   │   ├── config/
│   │   │   └── db.js           # MySQL connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── farmController.js
│   │   │   └── deviceController.js
│   │   ├── middlewares/
│   │   │   └── auth.js         # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── farm.js
│   │   │   └── device.js
│   │   └── services/
│   │       └── mqttService.js  # MQTT service
│   ├── .env                    # Environment variables
│   └── database.sql            # Database schema
└── frontend/
    ├── app/
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── dashboard/
    │       ├── layout.tsx
    │       ├── page.tsx        # Dashboard overview
    │       ├── farms/page.tsx  # Farm management
    │       └── devices/page.tsx # Device management
    └── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server
- MQTT Broker (HiveMQ, Mosquitto, etc.)

### 1. Clone the repository
```bash
git clone <repository-url>
cd my-iot-farm
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Configure Environment
Create `.env` file in backend directory:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here

# MQTT Configuration
MQTT_HOST=mqtt://localhost
MQTT_PORT=1883
MQTT_USER=your_mqtt_username
MQTT_PASS=your_mqtt_password

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=iot_farm
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
```

### 4. Database Setup
```bash
mysql -u your_username -p your_database < database.sql
```

### 5. Start Backend Server
```bash
npm run dev
```

### 6. Frontend Setup
```bash
cd frontend
npm install
```

### 7. Start Frontend Server
```bash
npm run dev
```

## 📡 MQTT Topic Structure

### Hardware → Backend (Sensor Data)
```
farm/node/{uuid}/input/{sensor_prefix}
```
Examples:
- `farm/node/node001/input/TEMP` - Temperature data
- `farm/node/node001/input/HUMID` - Humidity data
- `farm/node/node002/input/SOIL_MOIST` - Soil moisture data

### Backend → Hardware (Commands)
```
farm/node/{uuid}/output/{actuator_prefix}
```
Examples:
- `farm/node/node003/output/water` - Water pump control
- `farm/node/node003/output/light` - Light control
- `farm/node/node003/output/fan` - Fan control

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Farms
- `GET /api/farms` - Get user's farms (protected)
- `POST /api/farms` - Create new farm (protected)
- `PUT /api/farms/:id` - Update farm (protected)
- `DELETE /api/farms/:id` - Delete farm (protected)

### Devices
- `GET /api/devices` - Get user's devices (protected)
- `POST /api/devices` - Add new device (protected)
- `POST /api/devices/:id/command` - Send command to device (protected)
- `GET /api/devices/:id/sensor-data` - Get sensor data (protected)

## 🎯 Usage Examples

### 1. Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName": "John Doe", "email": "john@example.com", "password": "password123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "password123"}'
```

### 3. Add Farm
```bash
curl -X POST http://localhost:5000/api/farms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name": "My Farm", "description": "Organic vegetable farm", "size": 5.5}'
```

### 4. Add IoT Device
```bash
curl -X POST http://localhost:5000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"uuid": "node001", "farm_id": 1, "description": "Temperature sensor"}'
```

### 5. Send Command
```bash
curl -X POST http://localhost:5000/api/devices/1/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"actuator_prefix": "water", "val": "on"}'
```

## 🌱 Hardware Integration

### Arduino/ESP32 Example
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// WiFi and MQTT configuration
const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* mqtt_server = "your_mqtt_broker";
const char* device_uuid = "node001";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(4, DHT22);

void setup() {
  Serial.begin(115200);
  dht.begin();
  setupWiFi();
  setupMQTT();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();
  
  // Read sensor data
  float temp = dht.readTemperature();
  float humid = dht.readHumidity();
  
  // Publish sensor data
  char topic[50];
  sprintf(topic, "farm/node/%s/input/TEMP", device_uuid);
  client.publish(topic, String(temp).c_str());
  
  sprintf(topic, "farm/node/%s/input/HUMID", device_uuid);
  client.publish(topic, String(humid).c_str());
  
  delay(5000); // Send data every 5 seconds
}
```

## 📱 Mobile App Support

The API is designed to support mobile applications with:
- JWT-based authentication
- RESTful API endpoints
- Real-time data via MQTT
- Responsive JSON responses

## 🔧 Development

### Running Tests
```bash
cd backend
npm test

cd frontend
npm test
```

### Building for Production
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Email: support@iotfarm.com
- Documentation: [Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)

---

🌾 **Smart Farming, Better Living** 🌾
