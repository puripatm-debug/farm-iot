'use client';

import { useState } from 'react';
import { deviceAPI } from '@/lib/api';

export default function AddDeviceModal({ isOpen, onClose, farmId, onDeviceAdded }) {
  const [formData, setFormData] = useState({
    uuid: '',
    description: '',
    status: 1,
    unit: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await deviceAPI.createDevice({
        ...formData,
        farm_id: farmId,
      });
      
      onDeviceAdded();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเพิ่มอุปกรณ์');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      uuid: '',
      description: '',
      status: 1,
      unit: '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            เพิ่มอุปกรณ์ IoT ใหม่
          </h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="uuid" className="block text-sm font-medium text-gray-700">
                UUID ของอุปกรณ์
              </label>
              <input
                id="uuid"
                name="uuid"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น SENSOR_001"
                value={formData.uuid}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                รายละเอียดอุปกรณ์
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น เซนเซอร์วัดความชื้นในดิน"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                หน่วยวัด (ถ้ามี)
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น %, °C, Lux"
                value={formData.unit}
                onChange={handleChange}
              />
            </div>

            <div className="flex items-center">
              <input
                id="status"
                name="status"
                type="checkbox"
                checked={formData.status === 1}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="status" className="ml-2 block text-sm text-gray-900">
                เปิดใช้งานอุปกรณ์
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'กำลังเพิ่ม...' : 'เพิ่มอุปกรณ์'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
