'use client';

import { useState } from 'react';
import { iotAPI } from '@/lib/api';

export default function MqttControl({ device }) {
  const [commandData, setCommandData] = useState({
    pin: '',
    val: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCommandData({
      ...commandData,
      [name]: value,
    });
  };

  const handleSendCommand = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await iotAPI.sendCommand(device.uuid, commandData);
      setMessage(`✅ ส่งคำสั่งสำเร็จ: ${JSON.stringify(response.data.command)}`);
      setCommandData({ pin: '', val: '' });
    } catch (error) {
      setMessage(`❌ ส่งคำสั่งล้มเหลว: ${error.response?.data?.error || 'เกิดข้อผิดพลาด'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCommand = (pin, val) => {
    setCommandData({ pin: pin.toString(), val });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="font-semibold text-lg mb-3">ควบคุมอุปกรณ์: {device.description || device.uuid}</h4>
      
      {message && (
        <div className={`p-3 rounded mb-3 ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Quick Control Buttons */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">ควบคุมด่วน:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickCommand(1, 'ON')}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
          >
            Pin 1: เปิด
          </button>
          <button
            onClick={() => handleQuickCommand(1, 'OFF')}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
          >
            Pin 1: ปิด
          </button>
          <button
            onClick={() => handleQuickCommand(2, 'ON')}
            className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded"
          >
            Pin 2: เปิด
          </button>
          <button
            onClick={() => handleQuickCommand(2, 'OFF')}
            className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded"
          >
            Pin 2: ปิด
          </button>
        </div>
      </div>

      {/* Custom Command Form */}
      <form onSubmit={handleSendCommand} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
              Pin Number
            </label>
            <input
              id="pin"
              name="pin"
              type="number"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="1, 2, 3..."
              value={commandData.pin}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="val" className="block text-sm font-medium text-gray-700">
              Command Value
            </label>
            <input
              id="val"
              name="val"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="ON, OFF, 50, HIGH..."
              value={commandData.val}
              onChange={handleChange}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'กำลังส่งคำสั่ง...' : 'ส่งคำสั่ง MQTT'}
        </button>
      </form>

      <div className="mt-3 text-xs text-gray-500">
        <p>Topic: farm/{device.uuid}/command</p>
        <p>MQTT Broker: comsci2.srru.ac.th:1883</p>
      </div>
    </div>
  );
}
