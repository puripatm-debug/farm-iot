'use client';

import { useState, useEffect } from 'react';
import { deviceAPI, farmAPI } from '../../../src/lib/api';

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

interface SensorData {
  sensor_prefix: string;
  val: number;
  created_at: string;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({ uuid: '', farm_id: '', description: '', device_type: 'sensor' });
  const [commandData, setCommandData] = useState({ actuator_prefix: '', val: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [devicesRes, farmsRes] = await Promise.all([
        deviceAPI.getDevices(),
        farmAPI.getFarms()
      ]);
      setDevices(devicesRes.data);
      setFarms(farmsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSensorData = async (deviceId: number) => {
    try {
      const response = await deviceAPI.getSensorData(String(deviceId));
      setSensorData(response.data);
    } catch (error) {
      console.error('Error loading sensor data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingDevice) {
        await deviceAPI.updateDevice(String(editingDevice.id), formData);
      } else {
        await deviceAPI.createDevice(formData);
      }
      setShowModal(false);
      setEditingDevice(null);
      setFormData({ uuid: '', farm_id: '', description: '', device_type: 'sensor' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (device: Device) => {
    if (!confirm(`ต้องการลบอุปกรณ์ "${device.uuid}" ใช่หรือไม่?`)) return;
    try {
      await deviceAPI.deleteDevice(String(device.id));
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setSubmitting(true);
    setError('');
    try {
      const response = await deviceAPI.sendCommand(String(selectedDevice.id), commandData);
      setShowCommandModal(false);
      setCommandData({ actuator_prefix: '', val: '' });
      alert(`ส่งคำสั่งสำเร็จ!\nTopic: ${response.data.topic}\nValue: ${response.data.val}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewData = (device: Device) => {
    setSelectedDevice(device);
    loadSensorData(device.id);
  };

  const openModal = () => {
    setEditingDevice(null);
    setFormData({ uuid: '', farm_id: '', description: '', device_type: 'sensor' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      uuid: device.uuid,
      farm_id: String(device.farm_id),
      description: device.description || '',
      device_type: device.device_type || 'sensor',
    });
    setError('');
    setShowModal(true);
  };

  const openCommandModal = (device: Device) => {
    setSelectedDevice(device);
    setCommandData({ actuator_prefix: '', val: '' });
    setError('');
    setShowCommandModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-r-transparent"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">อุปกรณ์ IoT</h1>
          <p className="text-gray-500 text-sm mt-1">อุปกรณ์ทั้งหมด {devices.length} เครื่อง</p>
        </div>
        <button
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มอุปกรณ์
        </button>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    device.status === 1 ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    📡
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{device.uuid}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        device.device_type === 'actuator'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {device.device_type === 'actuator' ? 'Actuator' : 'Sensor'}
                      </span>
                      <span className="text-xs text-gray-400">{device.farm_name}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  device.status === 1
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {device.status === 1 ? 'ออนไลน์' : 'ออฟไลน์'}
                </span>
              </div>

              {device.farm_status === 0 && (
                <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-600 text-xs">⚠️</span>
                  <span className="text-xs font-medium text-yellow-700">ฟาร์มถูกระงับ — ไม่สามารถสั่งงานได้</span>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-3">{device.description || 'ไม่มีคำอธิบาย'}</p>

              <div className="text-xs text-gray-400">
                เพิ่มเมื่อ: {new Date(device.created_at).toLocaleDateString('th-TH')}
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-3 flex gap-1">
              <button
                onClick={() => handleViewData(device)}
                className="flex-1 text-center py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              >
                ดูข้อมูล
              </button>
              <button
                onClick={() => device.farm_status !== 0 && openCommandModal(device)}
                disabled={device.farm_status === 0}
                className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-colors ${
                  device.farm_status === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-green-600 hover:bg-green-50 cursor-pointer'
                }`}
                title={device.farm_status === 0 ? 'ฟาร์มถูกระงับ' : ''}
              >
                ควบคุม
              </button>
              <button
                onClick={() => openEditModal(device)}
                className="flex-1 text-center py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
              >
                แก้ไข
              </button>
              <button
                onClick={() => handleDelete(device)}
                className="flex-1 text-center py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="col-span-full">
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">ยังไม่มีอุปกรณ์</h3>
              <p className="text-gray-400 text-sm mb-4">เริ่มต้นโดยการเพิ่มอุปกรณ์ IoT แรกของคุณ</p>
              <button onClick={openModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer">
                + เพิ่มอุปกรณ์ใหม่
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sensor Data Modal */}
      {selectedDevice && !showCommandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDevice(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">ข้อมูลเซ็นเซอร์ - {selectedDevice.uuid}</h3>
              <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {sensorData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-3 font-medium text-gray-600">เซ็นเซอร์</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">ค่า</th>
                        <th className="text-left py-3 px-3 font-medium text-gray-600">เวลา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sensorData.map((data, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3">
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{data.sensor_prefix}</span>
                          </td>
                          <td className="py-2.5 px-3 font-medium">{data.val}</td>
                          <td className="py-2.5 px-3 text-gray-500">{new Date(data.created_at).toLocaleString('th-TH')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">ยังไม่มีข้อมูลเซ็นเซอร์</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <button onClick={() => setSelectedDevice(null)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{editingDevice ? 'แก้ไขอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
              <button onClick={() => { setShowModal(false); setEditingDevice(null); }} className="text-gray-400 hover:text-gray-600 cursor-pointer">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">UUID *</label>
                  <input
                    type="text"
                    value={formData.uuid}
                    onChange={(e) => setFormData({ ...formData, uuid: e.target.value })}
                    placeholder="เช่น: node001"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ฟาร์ม *</label>
                  <select
                    value={formData.farm_id}
                    onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="">เลือกฟาร์ม</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ประเภทอุปกรณ์ *</label>
                  <div className="flex gap-3">
                    {(['sensor', 'actuator'] as const).map((type) => (
                      <label key={type} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.device_type === type
                          ? type === 'sensor' ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="device_type"
                          value={type}
                          checked={formData.device_type === type}
                          onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                          className="hidden"
                        />
                        <span className="text-lg">{type === 'sensor' ? '📡' : '⚙️'}</span>
                        <span className="text-sm font-medium">{type === 'sensor' ? 'Sensor' : 'Actuator'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">คำอธิบาย</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="เช่น: เซ็นเซอร์วัดอุณหภูมิกลางไร่"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModal(false); setEditingDevice(null); }} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all cursor-pointer">
                  {submitting ? 'กำลังบันทึก...' : editingDevice ? 'บันทึกการแก้ไข' : 'เพิ่มอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Command Modal */}
      {showCommandModal && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCommandModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">ควบคุม Actuator - {selectedDevice.uuid}</h3>
              <button onClick={() => setShowCommandModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendCommand}>
              <div className="p-6 space-y-4">
                {/* MQTT Pub/Sub Info */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 mb-1">MQTT Publish Topic:</p>
                  <code className="text-sm text-blue-700 font-mono">
                    farm/node/{selectedDevice.uuid}/output/{commandData.actuator_prefix || '{actuator_prefix}'}
                  </code>
                  <p className="text-xs text-gray-400 mt-2">
                    Publish/Subscribe Model: Frontend → API → MQTT Broker → Device
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Actuator Prefix *</label>
                  <input
                    type="text"
                    value={commandData.actuator_prefix}
                    onChange={(e) => setCommandData({ ...commandData, actuator_prefix: e.target.value })}
                    placeholder="เช่น: water, light, fan"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">คำสั่ง *</label>
                  <input
                    type="text"
                    value={commandData.val}
                    onChange={(e) => setCommandData({ ...commandData, val: e.target.value })}
                    placeholder="เช่น: on, off, 25"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">คำสั่งด่วน</label>
                  <div className="flex gap-2">
                    {['on', 'off', 'auto'].map((cmd) => (
                      <button
                        key={cmd}
                        type="button"
                        onClick={() => setCommandData({ ...commandData, val: cmd })}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                          commandData.val === cmd
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {cmd.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowCommandModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer">
                  ยกเลิก
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded-xl transition-all cursor-pointer">
                  {submitting ? 'กำลังส่ง...' : 'ส่งคำสั่ง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
