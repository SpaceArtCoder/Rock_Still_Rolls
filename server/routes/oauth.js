// server/routes/oauth.js (С ТАЙМАУТОМ И ПОВТОРНЫМИ ПОПЫТКАМИ)
import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/client.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
};

// Настройки axios с увеличенным таймаутом
const axiosConfig = {
    timeout: 30000, // 30 секунд вместо дефолтных
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    }
};

// Функция с повторными попытками
async function axiosWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`Попытка ${i + 2}/${retries + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// ============================================
// GOOGLE OAUTH
// ============================================

router.get('/google', (req, res) => {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'online',
        prompt: 'select_account'
    });

    res.redirect(`${googleAuthUrl}?${params}`);
});

router.get('/google/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }

    try {
        console.log('Обмен code на токен...');

        // Обмен code на токены (С ПОВТОРНЫМИ ПОПЫТКАМИ)
        const tokenResponse = await axiosWithRetry(async () => {
            return await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: process.env.GOOGLE_REDIRECT_URI,
                grant_type: 'authorization_code'
            }, axiosConfig);
        });

        const { access_token } = tokenResponse.data;
        console.log('Токен получен');

        // Получение данных пользователя (С ПОВТОРНЫМИ ПОПЫТКАМИ)
        const userResponse = await axiosWithRetry(async () => {
            return await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                ...axiosConfig,
                headers: {
                    ...axiosConfig.headers,
                    Authorization: `Bearer ${access_token}`
                }
            });
        });

        const { id, email, name, picture } = userResponse.data;
        console.log('Данные пользователя получены:', email);

        // Поиск или создание пользователя
        let user = await prisma.user.findUnique({
            where: { googleId: id }
        });

        if (!user) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        googleId: id,
                        provider: 'google',
                        avatarUrl: picture || existingUser.avatarUrl
                    }
                });
            } else {
                user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        googleId: id,
                        provider: 'google',
                        avatarUrl: picture,
                        password: null
                    }
                });
            }
        }

        // Создаем JWT токен
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Устанавливаем cookie
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Редирект на фронтенд
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);

    } catch (error) {
        console.error('Google OAuth error:', error.message);

        if (error.code === 'ETIMEDOUT') {
            console.error('');
            console.error('❌ ТАЙМАУТ: Не удалось подключиться к Google API');
            console.error('Проверьте:');
            console.error('  1. Файрвол (sudo ufw status)');
            console.error('  2. Интернет соединение');
            console.error('  3. DNS (ping oauth2.googleapis.com)');
            console.error('');
        }

        res.redirect(`${process.env.FRONTEND_URL}?error=oauth_timeout`);
    }
});

// ============================================
// GITHUB OAUTH
// ============================================

router.get('/github', (req, res) => {
    const githubAuthUrl = 'https://github.com/login/oauth/authorize';

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
        scope: 'user:email',
        allow_signup: 'true'
    });

    res.redirect(`${githubAuthUrl}?${params}`);
});

router.get('/github/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }

    try {
        console.log('GitHub: Обмен code на токен...');

        // Обмен code на токен (С ПОВТОРНЫМИ ПОПЫТКАМИ)
        const tokenResponse = await axiosWithRetry(async () => {
            return await axios.post(
                'https://github.com/login/oauth/access_token',
                {
                    client_id: process.env.GITHUB_CLIENT_ID,
                    client_secret: process.env.GITHUB_CLIENT_SECRET,
                    redirect_uri: process.env.GITHUB_REDIRECT_URI,
                    code
                },
                {
                    ...axiosConfig,
                    headers: {
                        ...axiosConfig.headers,
                        Accept: 'application/json'
                    }
                }
            );
        });

        const { access_token } = tokenResponse.data;
        console.log('GitHub: Токен получен');

        // Получение данных пользователя
        const userResponse = await axiosWithRetry(async () => {
            return await axios.get('https://api.github.com/user', {
                ...axiosConfig,
                headers: {
                    ...axiosConfig.headers,
                    Authorization: `Bearer ${access_token}`
                }
            });
        });

        const githubUser = userResponse.data;

        // Получение email
        let email = githubUser.email;
        if (!email) {
            const emailsResponse = await axiosWithRetry(async () => {
                return await axios.get('https://api.github.com/user/emails', {
                    ...axiosConfig,
                    headers: {
                        ...axiosConfig.headers,
                        Authorization: `Bearer ${access_token}`
                    }
                });
            });
            const primaryEmail = emailsResponse.data.find(e => e.primary && e.verified);
            email = primaryEmail ? primaryEmail.email : null;
        }

        if (!email) {
            return res.redirect(`${process.env.FRONTEND_URL}?error=no_email`);
        }

        console.log('GitHub: Данные пользователя получены:', email);

        // Поиск или создание пользователя
        let user = await prisma.user.findUnique({
            where: { githubId: String(githubUser.id) }
        });

        if (!user) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        githubId: String(githubUser.id),
                        provider: 'github',
                        avatarUrl: githubUser.avatar_url || existingUser.avatarUrl
                    }
                });
            } else {
                user = await prisma.user.create({
                    data: {
                        email,
                        name: githubUser.name || githubUser.login,
                        githubId: String(githubUser.id),
                        provider: 'github',
                        avatarUrl: githubUser.avatar_url,
                        password: null
                    }
                });
            }
        }

        // Создаем JWT токен
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Устанавливаем cookie
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Редирект на фронтенд
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);

    } catch (error) {
        console.error('GitHub OAuth error:', error.message);

        if (error.code === 'ETIMEDOUT') {
            console.error('');
            console.error('❌ ТАЙМАУТ: Не удалось подключиться к GitHub API');
            console.error('Проверьте интернет соединение');
            console.error('');
        }

        res.redirect(`${process.env.FRONTEND_URL}?error=oauth_timeout`);
    }
});

export default router;