'use client';

import { useState, useEffect } from 'react';
import { farmAPI } from '@/lib/api';

export default function AddFarmModal({ isOpen, onClose, onFarmAdded }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lat: '',
    lng: '',
    size: '',
    farm_category_id: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const response = await farmAPI.getCategories();
      setCategories(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({ ...prev, farm_category_id: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await farmAPI.createFarm(formData);
      
      onFarmAdded();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสร้างฟาร์ม');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      lat: '',
      lng: '',
      size: '',
      farm_category_id: '',
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
            สร้างฟาร์มใหม่
          </h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                ชื่อฟาร์ม *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น ฟาร์มสมุนไพรบ้านทอง"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                รายละเอียดฟาร์ม
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="เช่น ฟาร์มปลูกพืชอินทรีย์ขนาดเล็ก"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="farm_category_id" className="block text-sm font-medium text-gray-700">
                ประเภทฟาร์ม *
              </label>
              <select
                id="farm_category_id"
                name="farm_category_id"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.farm_category_id}
                onChange={handleChange}
              >
                <option value="">เลือกประเภทฟาร์ม</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.cat_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lat" className="block text-sm font-medium text-gray-700">
                  ละติจูด
                </label>
                <input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="13.7563"
                  value={formData.lat}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lng" className="block text-sm font-medium text-gray-700">
                  ลองจิจูด
                </label>
                <input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="100.5018"
                  value={formData.lng}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700">
                ขนาดฟาร์ม (ไร่)
              </label>
              <input
                id="size"
                name="size"
                type="number"
                step="0.1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="5.5"
                value={formData.size}
                onChange={handleChange}
              />
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
                {loading ? 'กำลังสร้าง...' : 'สร้างฟาร์ม'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
