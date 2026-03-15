'use client';

import { useState, useEffect } from 'react';
import { deviceAPI } from '../../../src/lib/api';
import { mqttClient } from '../../../src/lib/mqtt';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SensorData {
  uuid: string;
  sensor_prefix: string;
  value: number;
  timestamp: Date;
}

interface Device {
  id: number;
  uuid: string;
  farm_id: number;
  farm_name: string;
  description?: string;
  status: number;
  device_type?: string;
  farm_status?: number;
  created_at: string;
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MonitorPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [realtimeData, setRealtimeData] = useState<Map<string, SensorData[]>>(new Map());
  const [mqttStatus, setMqttStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    connectMQTT();

    // API Polling fallback - fetch sensor data every 5 seconds
    const pollInterval = setInterval(() => {
      pollSensorData();
    }, 5000);

    return () => {
      mqttClient.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const devicesRef = { current: [] as Device[] };

  const loadDevices = async () => {
    try {
      const response = await deviceAPI.getDevices();
      setDevices(response.data);
      devicesRef.current = response.data;
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const pollSensorData = async () => {
    try {
      for (const device of devicesRef.current) {
        const response = await deviceAPI.getSensorData(String(device.id));
        const sensorData = response.data;
        if (sensorData.length > 0) {
          setRealtimeData(prev => {
            const newMap = new Map(prev);
            const formatted = sensorData
              .reverse()
              .map((d: any) => ({
                uuid: device.uuid,
                sensor_prefix: d.sensor_prefix,
                value: parseFloat(d.val),
                timestamp: new Date(d.created_at),
              }));
            newMap.set(device.uuid, formatted.slice(-50));
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  const connectMQTT = async () => {
    try {
      setMqttStatus('connecting');
      await mqttClient.connect();
      setMqttStatus('connected');

      mqttClient.subscribeToAllDevices((data) => {
        setRealtimeData(prev => {
          const newMap = new Map(prev);
          const deviceData = newMap.get(data.uuid) || [];
          const updatedData = [...deviceData, data].slice(-50);
          newMap.set(data.uuid, updatedData);
          return newMap;
        });
      });
    } catch (error) {
      console.error('MQTT connection failed:', error);
      setMqttStatus('disconnected');
    }
  };

  const getDeviceData = (uuid: string) => realtimeData.get(uuid) || [];

  const getLatestValue = (uuid: string, sensorType: string) => {
    const data = getDeviceData(uuid);
    const latest = data.filter(d => d.sensor_prefix === sensorType).pop();
    return latest?.value ?? '-';
  };

  const getSensorTypes = (uuid: string) => {
    const data = getDeviceData(uuid);
    return Array.from(new Set(data.map(d => d.sensor_prefix)));
  };

  const getChartData = (uuid: string, sensorType: string) => {
    const data = getDeviceData(uuid)
      .filter(d => d.sensor_prefix === sensorType)
      .slice(-20);
    return data.map((d, i) => ({
      time: new Date(d.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: d.value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบอุปกรณ์ IoT</h1>
          <p className="text-gray-500 text-sm mt-1">ข้อมูลสดจากเซ็นเซอร์ทั้งหมด (Real-time via MQTT)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${
            mqttStatus === 'connected' ? 'bg-green-500' :
            mqttStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
          }`}></div>
          <span className="text-sm font-medium text-gray-600">
            {mqttStatus === 'connected' ? 'MQTT เชื่อมต่อแล้ว' :
             mqttStatus === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'ไม่ได้เชื่อมต่อ'}
          </span>
        </div>
      </div>

      {/* MQTT Subscribe Info */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs font-medium text-blue-700">
          Subscribe Topic: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">farm/node/+/input/#</code>
          <span className="ml-3 text-blue-500">| Broker: comsci2.srru.ac.th:1883</span>
        </p>
      </div>

      {/* Device Cards with Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((device) => {
          const deviceData = getDeviceData(device.uuid);
          const sensorTypes = getSensorTypes(device.uuid);

          return (
            <div key={device.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Device Header */}
              <div className={`px-5 py-3 ${
                device.farm_status === 0 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                device.status === 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-400'
              } text-white flex items-center justify-between`}>
                <div>
                  <h3 className="font-semibold">{device.uuid}</h3>
                  <p className="text-xs opacity-80">{device.farm_name} | Topic: farm/node/{device.uuid}/input/*</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  device.farm_status === 0 ? 'bg-white/20' :
                  device.status === 1 ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {device.farm_status === 0 ? 'ระงับ' : device.status === 1 ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>

              <div className="p-5 relative">
                {device.farm_status === 0 && (
                  <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center">
                    <div className="text-4xl mb-2">🚫</div>
                    <p className="text-lg font-bold text-red-500">ฟาร์มถูกระงับการใช้งาน</p>
                    <p className="text-sm text-gray-400 mt-1">หยุดแสดงข้อมูลเซ็นเซอร์ชั่วคราว</p>
                  </div>
                )}
                {sensorTypes.length > 0 ? (
                  <div className="space-y-5">
                    {sensorTypes.map((sensorType, idx) => {
                      const chartData = getChartData(device.uuid, sensorType);
                      const latestValue = getLatestValue(device.uuid, sensorType);
                      const color = CHART_COLORS[idx % CHART_COLORS.length];

                      return (
                        <div key={sensorType}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                              <span className="text-sm font-medium text-gray-700">{sensorType}</span>
                            </div>
                            <span className="text-xl font-bold" style={{ color }}>{latestValue}</span>
                          </div>

                          {/* Line Chart */}
                          {chartData.length > 1 ? (
                            <div className="h-32">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" width={40} />
                                  <Tooltip
                                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                    labelStyle={{ fontWeight: 600 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: color }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : chartData.length === 1 ? (
                            <p className="text-xs text-gray-400 text-center py-2">รอข้อมูลเพิ่มเติมเพื่อแสดงกราฟ...</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📡</div>
                    <p className="text-sm text-gray-400">รอข้อมูลเซ็นเซอร์...</p>
                    <p className="text-xs text-gray-300 mt-1">Subscribe: farm/node/{device.uuid}/input/#</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {devices.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">ยังไม่มีอุปกรณ์</h3>
              <p className="text-gray-400 text-sm">เริ่มต้นโดยการเพิ่มอุปกรณ์ IoT แรกของคุณ</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
