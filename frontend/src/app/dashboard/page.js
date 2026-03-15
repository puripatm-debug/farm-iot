'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { farmAPI, iotAPI } from '@/lib/api';
import AddFarmModal from '@/components/AddFarmModal';
import AddDeviceModal from '@/components/AddDeviceModal';
import MqttControl from '@/components/MqttControl';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userData || !token) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    fetchFarms();
  }, [router]);

  const fetchFarms = async () => {
    try {
      const response = await farmAPI.getFarms();
      setFarms(response.data);
      if (response.data.length > 0) {
        setSelectedFarm(response.data[0]);
        fetchDevices(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async (farmId) => {
    try {
      const response = await iotAPI.getDevices(farmId);
      setDevices(response.data);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleFarmChange = (farm) => {
    setSelectedFarm(farm);
    setSelectedDevice(null);
    fetchDevices(farm.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleFarmAdded = () => { fetchFarms(); };
  const handleDeviceAdded = () => { if (selectedFarm) fetchDevices(selectedFarm.id); };

  if (loading) {
    return (
      <div className="d-flex vh-100 align-items-center justify-content-center bg-light">
        <div className="spinner-border text-success me-2" role="status" />
        <span className="fs-5">กำลังโหลด...</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden" style={{ background: '#f0f4f8' }}>

      {/* ── Navbar ── */}
      <nav className="navbar navbar-dark bg-success shadow-sm py-2 flex-shrink-0">
        <div className="container-fluid px-3">
          <span className="navbar-brand mb-0 fw-bold fs-5">
            🌿 IoT Farm Dashboard
          </span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-white-50 small">
              {user?.firstname} {user?.lastname}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="container-fluid flex-grow-1 overflow-auto py-3 px-3">

        {/* ── Farm Section ── */}
        <div className="card shadow-sm mb-3">
          <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
            <h6 className="mb-0 fw-bold text-success">🌾 ฟาร์มของคุณ</h6>
            <button
              className="btn btn-success btn-sm"
              onClick={() => setShowAddFarmModal(true)}
            >
              + เพิ่มฟาร์ม
            </button>
          </div>

          <div className="card-body py-2">
            {farms.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-muted mb-2">คุณยังไม่มีฟาร์ม</p>
                <button
                  onClick={() => setShowAddFarmModal(true)}
                  className="btn btn-success btn-sm"
                >
                  สร้างฟาร์มใหม่
                </button>
              </div>
            ) : (
              <div className="row g-2">
                {farms.map((farm) => (
                  <div key={farm.id} className="col-6 col-md-4 col-lg-3">
                    <div
                      className={`card h-100 cursor-pointer border-2 ${selectedFarm?.id === farm.id
                          ? 'border-success bg-success bg-opacity-10'
                          : 'border-light'
                        }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleFarmChange(farm)}
                    >
                      <div className="card-body p-2">
                        <p className="fw-semibold mb-0 small">{farm.name}</p>
                        <p className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>
                          {farm.cat_name || 'ไม่ระบุประเภท'}
                        </p>
                        {farm.description && (
                          <p className="text-secondary mb-0" style={{ fontSize: '0.7rem' }}>
                            {farm.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Device Section ── */}
        {selectedFarm && (
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
              <h6 className="mb-0 fw-bold text-primary">
                📡 อุปกรณ์ IoT — {selectedFarm.name}
              </h6>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAddDeviceModal(true)}
              >
                + เพิ่มอุปกรณ์
              </button>
            </div>

            <div className="card-body py-2">
              {devices.length === 0 ? (
                <p className="text-muted text-center py-2 mb-0 small">
                  ยังไม่มีอุปกรณ์ IoT ในฟาร์มนี้
                </p>
              ) : (
                <div className="row g-2">
                  {devices.map((device) => (
                    <div key={device.id} className="col-6 col-md-4 col-lg-3">
                      <div className="card h-100 border">
                        <div className="card-body p-2">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <p className="fw-semibold mb-0 small">
                              {device.description || device.uuid}
                            </p>
                            <span className={`badge ${device.status ? 'bg-success' : 'bg-danger'}`}
                              style={{ fontSize: '0.65rem' }}>
                              {device.status ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                            {device.uuid}
                          </p>
                          {device.unit && (
                            <p className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>
                              หน่วย: {device.unit}
                            </p>
                          )}
                          <div className="d-flex gap-1 mt-1">
                            <button
                              onClick={() => setSelectedDevice(device)}
                              className="btn btn-primary btn-sm py-0 px-2"
                              style={{ fontSize: '0.7rem' }}
                            >
                              ควบคุม
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm py-0 px-2"
                              style={{ fontSize: '0.7rem' }}
                            >
                              ดูข้อมูล
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MQTT Control ── */}
        {selectedDevice && (
          <div className="card shadow-sm">
            <div className="card-header bg-white py-2">
              <h6 className="mb-0 fw-bold text-warning">⚙️ ควบคุมอุปกรณ์: {selectedDevice.description || selectedDevice.uuid}</h6>
            </div>
            <div className="card-body py-2">
              <MqttControl device={selectedDevice} />
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <AddFarmModal
        isOpen={showAddFarmModal}
        onClose={() => setShowAddFarmModal(false)}
        onFarmAdded={handleFarmAdded}
      />
      <AddDeviceModal
        isOpen={showAddDeviceModal}
        onClose={() => setShowAddDeviceModal(false)}
        farmId={selectedFarm?.id}
        onDeviceAdded={handleDeviceAdded}
      />
    </div>
  );
}
