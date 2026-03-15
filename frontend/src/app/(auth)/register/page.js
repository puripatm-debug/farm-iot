'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { validateEmail, validatePassword, validateUsername, validatePhone, validateRequired } from '@/components/Validation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstname: '',
    lastname: '',
    tel: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateRequired(formData.firstname)) {
      newErrors.firstname = 'กรุณากรอกชื่อ';
    }

    if (!validateRequired(formData.lastname)) {
      newErrors.lastname = 'กรุณากรอกนามสกุล';
    }

    if (!validateRequired(formData.username)) {
      newErrors.username = 'กรุณากรอกชื่อผู้ใช้';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษรและเป็นภาษาอังกฤษ/ตัวเลขเท่านั้น';
    }

    if (!validateRequired(formData.email)) {
      newErrors.email = 'กรุณากรอกอีเมล';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }

    if (formData.tel && !validatePhone(formData.tel)) {
      newErrors.tel = 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก';
    }

    if (!validateRequired(formData.password)) {
      newErrors.password = 'กรุณากรอกรหัสผ่าน';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!validateRequired(formData.confirmPassword)) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่าน';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = formData;
      await authAPI.register(registerData);
      
      // Redirect to login page after successful registration
      router.push('/auth/login?message=registration-success');
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            สมัครสมาชิก IoT Farm
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            หรือ{' '}
            <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.firstname ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900`}
                  placeholder="ชื่อ"
                  value={formData.firstname}
                  onChange={handleChange}
                />
                {errors.firstname && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700">
                  นามสกุล
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  required
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                    errors.lastname ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900`}
                  placeholder="นามสกุล"
                  value={formData.lastname}
                  onChange={handleChange}
                />
                {errors.lastname && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900`}
                placeholder="ชื่อผู้ใช้"
                value={formData.username}
                onChange={handleChange}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900`}
                placeholder="อีเมล"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="tel" className="block text-sm font-medium text-gray-700">
                เบอร์โทรศัพท์
              </label>
              <input
                id="tel"
                name="tel"
                type="tel"
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.tel ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900`}
                placeholder="เบอร์โทรศัพท์"
                value={formData.tel}
                onChange={handleChange}
              />
              {errors.tel && (
                <p className="mt-1 text-sm text-red-600">{errors.tel}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900`}
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900`}
                placeholder="ยืนยันรหัสผ่าน"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
