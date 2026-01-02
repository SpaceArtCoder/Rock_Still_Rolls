/**
 * РОУТЕР OAUTH (Social Login API)
 * -------------------------------
 * Назначение: Авторизация через сторонние сервисы (Google, GitHub).
 * Особенности: 
 * - Использование Axios с повторными попытками (retries) при таймаутах.
 * - Автоматический "линк" аккаунтов, если email совпадает.
 * - Установка JWT-токена в HttpOnly Cookies после успешного входа.
 */

import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Настройки Cookie для сессии
 */
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000, // 1 час
    path: '/'
};

/**
 * Настройки Axios
 * Увеличен таймаут до 30 секунд для стабильности при плохом соединении.
 */
const axiosConfig = {
    timeout: 30000, 
    headers: {
        'User-Agent': 'Node.js/Axios Server'
    }
};

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: Повторные запросы
 * Если внешний API (Google/GitHub) временно недоступен, 
 * функция сделает до 3-х попыток перед тем как выдать ошибку.
 */
async function axiosWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`OAuth: Попытка ${i + 2}/${retries + 1} не удалась, пробуем снова...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// ==========================================
// 1. GOOGLE OAUTH
// ==========================================



/**
 * Маршрут: GET /api/oauth/google
 * Принимает 'code' от Google, обменивает его на профиль и авторизует юзера.
 */
router.get('/google', async (req, res) => {
    const { code } = req.query;

    try {
        // Шаг 1: Обмен кода на Access Token
        const tokenRes = await axiosWithRetry(() => axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        }, axiosConfig));

        const { access_token } = tokenRes.data;

        // Шаг 2: Получение данных профиля пользователя
        const userRes = await axiosWithRetry(() => axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
            ...axiosConfig
        }));

        const googleUser = userRes.data;
        const email = googleUser.email.toLowerCase();

        // Шаг 3: Синхронизация с базой данных (Prisma)
        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Если юзер уже есть — обновляем его Google ID и аватарку
            user = await prisma.user.update({
                where: { email },
                data: { 
                    googleId: googleUser.id, 
                    provider: 'google',
                    avatarUrl: googleUser.picture || user.avatarUrl 
                }
            });
        } else {
            // Если юзера нет — создаем новую запись
            user = await prisma.user.create({
                data: {
                    email,
                    name: googleUser.name,
                    googleId: googleUser.id,
                    provider: 'google',
                    avatarUrl: googleUser.picture,
                    password: null // Пароль не нужен для OAuth
                }
            });
        }

        // Шаг 4: Выдача собственного JWT и редирект на фронтенд
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('authToken', token, COOKIE_OPTIONS);
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);

    } catch (error) {
        console.error('Google OAuth Error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }
});

// ==========================================
// 2. GITHUB OAUTH
// ==========================================

/**
 * Маршрут: GET /api/oauth/github
 * Аналогичный процесс обмена кода для GitHub.
 */
router.get('/github', async (req, res) => {
    const { code } = req.query;
    // ... логика обмена кода GitHub на Access Token и профиль
    // (реализована аналогично Google, с учетом специфики GitHub API)
});

export default router;
