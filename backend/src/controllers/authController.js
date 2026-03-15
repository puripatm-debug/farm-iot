const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

const authController = {
    async register(req, res) {
        try {
            const { username, email, password, firstname, lastname } = req.body;

            // Input Validation
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ (username, email, password)' });
            }
            if (password.length < 6) {
                return res.status(400).json({ message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
            }

            // Ensure default roles exist (auto-seed)
            await db.query(
                `INSERT IGNORE INTO user_roles (id, name, created_at, updated_at) VALUES
                 (1, 'admin', NOW(), NOW()),
                 (2, 'user', NOW(), NOW())`
            );

            // Check duplicate email/username
            const existing = await db.query(
                'SELECT id FROM users WHERE email = ? OR username = ?',
                [email, username]
            );
            if (existing.length > 0) {
                return res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
            }

            // Hash password
            const hashed = await bcrypt.hash(password, 10);

            // Insert user with default role = 2 (user)
            await db.query(
                'INSERT INTO users (username, email, password, firstname, lastname, user_role_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 2, NOW(), NOW())',
                [username, email, hashed, firstname || '', lastname || '']
            );

            res.status(201).json({ message: 'ลงทะเบียนสำเร็จ' });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async login(req, res) {
        try {
            const { email, password } = req.body;

            // Find user by email
            const user = await db.query(
                `SELECT u.id, u.username, u.email, u.password, u.firstname, u.lastname, ur.name as role
                 FROM users u 
                 LEFT JOIN user_roles ur ON u.user_role_id = ur.id 
                 WHERE u.email = ?`,
                [email]
            );

            if (user.length === 0) {
                return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            // Verify password
            const isValidPassword = await bcrypt.compare(password, user[0].password);
            if (!isValidPassword) {
                return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    user_id: user[0].id,
                    username: user[0].username,
                    role: user[0].role
                },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            res.json({
                message: 'เข้าสู่ระบบสำเร็จ',
                token,
                user: {
                    id: user[0].id,
                    username: user[0].username,
                    email: user[0].email,
                    firstname: user[0].firstname,
                    lastname: user[0].lastname,
                    role: user[0].role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    },

    async getProfile(req, res) {
        try {
            const user = await db.query(
                `SELECT u.id, u.username, u.email, u.firstname, u.lastname, u.tel, u.address, u.birth_date, u.last_login, ur.name as role, u.created_at
                 FROM users u 
                 LEFT JOIN user_roles ur ON u.user_role_id = ur.id 
                 WHERE u.id = ?`,
                [req.user.user_id]
            );

            if (user.length === 0) {
                return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
            }

            res.json(user[0]);
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
        }
    }
};

module.exports = authController;
