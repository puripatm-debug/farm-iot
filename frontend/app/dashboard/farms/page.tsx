'use client';

import { useState, useEffect } from 'react';
import { farmAPI } from '../../../src/lib/api';

interface Farm {
  id: number;
  name: string;
  description?: string;
  size?: number;
  cat_name?: string;
  status?: number;
  created_at: string;
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', size: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadFarms(); }, []);

  const loadFarms = async () => {
    try {
      const response = await farmAPI.getFarms();
      setFarms(response.data);
    } catch (error) {
      console.error('Error loading farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editingFarm) {
        await farmAPI.updateFarm(String(editingFarm.id), formData);
      } else {
        await farmAPI.createFarm(formData);
      }
      setShowModal(false);
      setEditingFarm(null);
      setFormData({ name: '', description: '', size: '' });
      loadFarms();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (farm: Farm) => {
    setEditingFarm(farm);
    setFormData({
      name: farm.name,
      description: farm.description || '',
      size: farm.size?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('คุณต้องการลบฟาร์มนี้ใช่หรือไม่?')) return;
    try {
      await farmAPI.deleteFarm(String(id));
      loadFarms();
    } catch (error) {
      console.error('Error deleting farm:', error);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await farmAPI.toggleStatus(String(id));
      loadFarms();
    } catch (error) {
      console.error('Error toggling farm status:', error);
    }
  };

  const openModal = () => {
    setEditingFarm(null);
    setFormData({ name: '', description: '', size: '' });
    setError('');
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการฟาร์ม</h1>
          <p className="text-gray-500 text-sm mt-1">ฟาร์มทั้งหมด {farms.length} แห่ง</p>
        </div>
        <button
          onClick={openModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มฟาร์ม
        </button>
      </div>

      {/* Farm Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {farms.map((farm) => (
          <div key={farm.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">
                    🌾
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{farm.name}</h3>
                    {farm.cat_name && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{farm.cat_name}</span>
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  farm.status === 1 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {farm.status === 1 ? 'ใช้งาน' : 'ระงับ'}
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-3">
                {farm.description || 'ไม่มีคำอธิบาย'}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-400">
                {farm.size && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {farm.size} ไร่
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(farm.created_at).toLocaleDateString('th-TH')}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
              <button
                onClick={() => handleEdit(farm)}
                className="flex-1 text-center py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleToggleStatus(farm.id)}
                className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  farm.status === 1
                    ? 'text-yellow-600 hover:bg-yellow-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {farm.status === 1 ? 'ระงับ' : 'เปิดใช้'}
              </button>
              <button
                onClick={() => handleDelete(farm.id)}
                className="flex-1 text-center py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}

        {farms.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🌾</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">ยังไม่มีฟาร์ม</h3>
              <p className="text-gray-400 text-sm mb-4">เริ่มต้นโดยการเพิ่มฟาร์มแรกของคุณ</p>
              <button
                onClick={openModal}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                + เพิ่มฟาร์มใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingFarm ? 'แก้ไขฟาร์ม' : 'เพิ่มฟาร์มใหม่'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อฟาร์ม *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="เช่น ฟาร์มสวนผัก"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ขนาด (ไร่)</label>
                  <input
                    type="number"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    min="0"
                    step="0.1"
                    placeholder="0.0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-xl transition-all cursor-pointer"
                >
                  {submitting ? 'กำลังบันทึก...' : (editingFarm ? 'อัปเดต' : 'สร้างฟาร์ม')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
