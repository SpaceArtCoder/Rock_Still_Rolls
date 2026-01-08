import express from 'express'; 
import axios from 'axios'; 
import jwt from 'jsonwebtoken'; 
import prisma from '../../prisma/client.js'; 

const router = express.Router(); // Инициализация маршрутизатора Express
const JWT_SECRET = process.env.JWT_SECRET; // Секрет для подписи JWT

// Настройки cookies
const COOKIE_OPTIONS = {
    httpOnly: true, // Запрещает доступ к cookies из JavaScript
    secure: process.env.NODE_ENV === 'production', // Включаем secure cookies только в продакшне
    sameSite: 'lax', // Защита от CSRF атак
    maxAge: 60 * 60 * 1000, // Время жизни cookie (1 час)
    path: '/' // Cookie доступно для всех путей
};

// Настройки axios с увеличенным таймаутом
const axiosConfig = {
    timeout: 30000, // Устанавливаем таймаут на 30 секунд
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36' // Заголовок User-Agent
    }
};

// Функция с повторными попытками для выполнения запросов
async function axiosWithRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn(); // Попытка выполнить запрос
        } catch (error) {
            if (i === retries - 1) throw error; // Если последняя попытка, выбрасываем ошибку
            console.log(`Попытка ${i + 2}/${retries + 1}...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Задержка между попытками
        }
    }
}

// ============================================
// GOOGLE OAUTH
// ============================================

// Маршрут для перенаправления на Google OAuth
router.get('/google', (req, res) => {
    const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID, // ID клиента Google OAuth
        redirect_uri: process.env.GOOGLE_REDIRECT_URI, // URI для перенаправления после аутентификации
        response_type: 'code', // Код для обмена на токен
        scope: 'openid email profile', // Разрешения
        access_type: 'online',
        prompt: 'select_account' // Предложение выбрать аккаунт
    });

    res.redirect(`${googleAuthUrl}?${params}`); // Перенаправление пользователя на Google OAuth
});

// Обработчик callback от Google после аутентификации
router.get('/google/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`); // Если ошибка, редирект на фронтенд с ошибкой
    }

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`); // Если нет кода, редирект на фронтенд с ошибкой
    }

    try {
        console.log('Обмен code на токен...');

        // Обмен code на токен (с повторными попытками)
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

        // Получение данных пользователя (с повторными попытками)
        const userResponse = await axiosWithRetry(async () => {
            return await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                ...axiosConfig,
                headers: {
                    ...axiosConfig.headers,
                    Authorization: `Bearer ${access_token}` // Заголовок с токеном
                }
            });
        });

        const { id, email, name, picture } = userResponse.data;
        console.log('Данные пользователя получены:', email);

        // Поиск или создание пользователя в базе данных
        let user = await prisma.user.findUnique({
            where: { googleId: id } // Проверяем, есть ли пользователь с данным googleId
        });

        if (!user) {
            const existingUser = await prisma.user.findUnique({
                where: { email } // Если пользователя с таким email не существует, проверяем по email
            });

            if (existingUser) {
                // Если пользователь найден по email, обновляем его данные
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        googleId: id,
                        provider: 'google',
                        avatarUrl: picture || existingUser.avatarUrl
                    }
                });
            } else {
                // Если пользователя нет, создаем нового
                user = await prisma.user.create({
                    data: {
                        email,
                        name,
                        googleId: id,
                        provider: 'google',
                        avatarUrl: picture,
                        password: null // Пароль не нужен, так как это OAuth
                    }
                });
            }
        }

        // Создаем JWT токен
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Устанавливаем cookie с токеном
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Редирект на фронтенд с успешной аутентификацией
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);

    } catch (error) {
        console.error('Google OAuth error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}?error=oauth_timeout`); // Редирект на фронтенд в случае ошибки
    }
});

// ============================================
// GITHUB OAUTH
// ============================================

// Маршрут для перенаправления на GitHub OAuth
router.get('/github', (req, res) => {
    const githubAuthUrl = 'https://github.com/login/oauth/authorize';

    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID, // ID клиента GitHub OAuth
        redirect_uri: process.env.GITHUB_REDIRECT_URI, // URI для перенаправления после аутентификации
        scope: 'user:email', // Запрашиваем доступ к email
        allow_signup: 'true' // Разрешение на создание новых пользователей
    });

    res.redirect(`${githubAuthUrl}?${params}`); // Перенаправляем пользователя на GitHub OAuth
});

// Обработчик callback от GitHub после аутентификации
router.get('/github/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`); // Если нет кода, редирект на фронтенд с ошибкой
    }

    try {
        console.log('GitHub: Обмен code на токен...');

        // Обмен code на токен (с повторными попытками)
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
                        Accept: 'application/json' // Запрашиваем данные в формате JSON
                    }
                }
            );
        });

        const { access_token } = tokenResponse.data;
        console.log('GitHub: Токен получен');

        // Получение данных пользователя с GitHub (с повторными попытками)
        const userResponse = await axiosWithRetry(async () => {
            return await axios.get('https://api.github.com/user', {
                ...axiosConfig,
                headers: {
                    ...axiosConfig.headers,
                    Authorization: `Bearer ${access_token}` // Передаем токен в заголовке
                }
            });
        });

        const githubUser = userResponse.data;

        // Получение email пользователя
        let email = githubUser.email;
        if (!email) {
            // Если email не найден, пытаемся получить его из списка email-ов пользователя
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
            return res.redirect(`${process.env.FRONTEND_URL}?error=no_email`); // Если email не найден, редирект на фронтенд с ошибкой
        }

        console.log('GitHub: Данные пользователя получены:', email);

        // Поиск или создание пользователя в базе данных
        let user = await prisma.user.findUnique({
            where: { githubId: String(githubUser.id) } // Проверяем, есть ли пользователь с данным githubId
        });

        if (!user) {
            const existingUser = await prisma.user.findUnique({
                where: { email } // Если пользователя с таким email не существует, проверяем по email
            });

            if (existingUser) {
                // Если пользователь найден по email, обновляем его данные
                user = await prisma.user.update({
                    where: { email },
                    data: {
                        githubId: String(githubUser.id),
                        provider: 'github',
                        avatarUrl: githubUser.avatar_url || existingUser.avatarUrl
                    }
                });
            } else {
                // Если пользователя нет, создаем нового
                user = await prisma.user.create({
                    data: {
                        email,
                        name: githubUser.name || githubUser.login,
                        githubId: String(githubUser.id),
                        provider: 'github',
                        avatarUrl: githubUser.avatar_url,
                        password: null // Пароль не нужен, так как это OAuth
                    }
                });
            }
        }

        // Создаем JWT токен
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

        // Устанавливаем cookie с токеном
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Редирект на фронтенд с успешной аутентификацией
        res.redirect(`${process.env.FRONTEND_URL}?auth=success`);

    } catch (error) {
        console.error('GitHub OAuth error:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}?error=oauth_timeout`); // Редирект на фронтенд в случае ошибки
    }
});

export default router;

