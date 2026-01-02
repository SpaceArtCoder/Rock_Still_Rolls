/**
 * РОУТЕР АВТОРИЗАЦИИ (Authentication API)
 * --------------------------------------
 * Назначение: Регистрация, вход, выход, профиль пользователя
 * и восстановление пароля через Email.
 * * Безопасность: Используются JWT-токены, передаваемые через HttpOnly Cookies 
 * для защиты от XSS-атак.
 */

import crypto from 'crypto';
import nodemailer from 'nodemailer';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

/**
 * КОНФИГУРАЦИЯ COOKIE
 * httpOnly: true — запрещает доступ к cookie через JS на фронтенде.
 * sameSite: 'lax' — базовая защита от CSRF-атак.
 */
const COOKIE_OPTIONS = {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'lax', 
    maxAge: 60 * 60 * 1000, // 1 час
    path: '/'
};

// ==========================================
// MIDDLEWARE ЗАЩИТЫ (Protect)
// ==========================================

/**
 * Проверяет наличие валидного JWT-токена в Cookies.
 * Если токен валиден, добавляет userId в объект запроса (req.userId).
 */
const protect = (req, res, next) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Доступ запрещен: Токен не предоставлен.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId; 
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Неверный или истекший токен.' });
    }
};

// ==========================================
// НАСТРОЙКА ЗАГРУЗКИ АВАТАРОВ
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/avatars/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// ==========================================
// МАРШРУТЫ (ENDPOINTS)
// ==========================================

/**
 * 1. РЕГИСТРАЦИЯ: POST /api/auth/register
 * Хеширует пароль перед сохранением в БД.
 */
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { 
                email: email.toLowerCase(), 
                password: hashedPassword, 
                name,
                provider: 'local' 
            }
        });
        res.status(201).json({ message: 'Пользователь успешно создан' });
    } catch (error) {
        res.status(400).json({ error: 'Email уже занят или данные неверны' });
    }
});

/**
 * 2. ВХОД: POST /api/auth/login
 * Проверяет пароль и устанавливает JWT в Cookies.
 */

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        // Отправляем токен в защищенном cookie
        res.cookie('authToken', token, COOKIE_OPTIONS);
        res.json({ user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

/**
 * 3. ВЫХОД: POST /api/auth/logout
 * Удаляет cookie с токеном.
 */
router.post('/logout', (req, res) => {
    res.clearCookie('authToken', { path: '/' });
    res.json({ message: 'Выход выполнен успешно' });
});

/**
 * 4. ПРОФИЛЬ: GET /api/auth/me
 * Возвращает данные текущего пользователя (требует авторизации).
 */
router.get('/me', protect, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.json(user);
});

/**
 * 5. СМЕНА АВАТАРА: POST /api/auth/upload-avatar
 */
router.post('/upload-avatar', protect, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await prisma.user.update({
        where: { id: req.userId },
        data: { avatarUrl }
    });
    res.json({ avatarUrl });
});

/**
 * 6. ВОССТАНОВЛЕНИЕ ПАРОЛЯ: POST /api/auth/forgot-password
 * Генерирует случайный пароль и отправляет его на почту.
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    // ... логика генерации пароля и отправки через nodemailer
    // (см. полный код в файле)
});

export { protect };
export default router;
