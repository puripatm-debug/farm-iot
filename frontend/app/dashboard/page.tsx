'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { farmAPI, deviceAPI } from '../../src/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFarms: 0,
    totalDevices: 0,
    onlineDevices: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      window.location.href = '/login';
      return;
    }

    setUser(JSON.parse(userData));
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [farmsResponse, devicesResponse] = await Promise.all([
        farmAPI.getFarms(),
        deviceAPI.getDevices()
      ]);

      setFarms(farmsResponse.data);
      setDevices(devicesResponse.data);

      setStats({
        totalFarms: farmsResponse.data.length,
        totalDevices: devicesResponse.data.length,
        onlineDevices: devicesResponse.data.filter((d: any) => d.status === 1).length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          สวัสดี, {user?.firstname || user?.username || 'User'} 👋
        </h1>
        <p className="text-gray-500 mt-1">ภาพรวมระบบฟาร์มอัจฉริยะของคุณ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">จำนวนฟาร์ม</p>
              <p className="text-3xl font-bold mt-1">{stats.totalFarms}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              🌾
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">อุปกรณ์ทั้งหมด</p>
              <p className="text-3xl font-bold mt-1">{stats.totalDevices}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              📡
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">อุปกรณ์ออนไลน์</p>
              <p className="text-3xl font-bold mt-1">{stats.onlineDevices}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">
              🟢
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Farms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">ฟาร์มล่าสุด</h3>
            <Link href="/dashboard/farms" className="text-sm text-green-600 hover:text-green-700 font-medium no-underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {farms.length > 0 ? (
              farms.slice(0, 5).map((farm) => (
                <div key={farm.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{farm.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{farm.description || 'ไม่มีคำอธิบาย'}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(farm.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">ยังไม่มีฟาร์ม</p>
                <Link href="/dashboard/farms" className="text-sm text-green-600 hover:text-green-700 font-medium no-underline mt-1 inline-block">
                  + เพิ่มฟาร์มแรก
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Devices */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">อุปกรณ์ล่าสุด</h3>
            <Link href="/dashboard/devices" className="text-sm text-green-600 hover:text-green-700 font-medium no-underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {devices.length > 0 ? (
              devices.slice(0, 5).map((device) => (
                <div key={device.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{device.uuid}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{device.description || 'ไม่มีคำอธิบาย'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    device.status === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {device.status === 1 ? 'ออนไลน์' : 'ออฟไลน์'}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-gray-400 text-sm">ยังไม่มีอุปกรณ์</p>
                <Link href="/dashboard/devices" className="text-sm text-green-600 hover:text-green-700 font-medium no-underline mt-1 inline-block">
                  + เพิ่มอุปกรณ์แรก
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
