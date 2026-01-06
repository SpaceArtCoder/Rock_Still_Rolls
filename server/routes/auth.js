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
// eslint-disable-next-line no-undef
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1h';

// НОВАЯ КОНСТАНТА: Настройки cookie
const COOKIE_OPTIONS = {
    httpOnly: true, // JavaScript не может прочитать (защита от XSS)
    // eslint-disable-next-line no-undef
    secure: process.env.NODE_ENV === 'production', // Только HTTPS в production
    sameSite: 'lax', // Защита от CSRF
    maxAge: 60 * 60 * 1000, // 1 час в миллисекундах
    path: '/' // Cookie доступен для всех путей
};

// --- ОБНОВЛЕННЫЙ Middleware для защиты маршрутов ---
const protect = (req, res, next) => {
    // ИЗМЕНЕНИЕ: Читаем токен из cookies вместо заголовка Authorization
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Доступ запрещен: Токен не предоставлен.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId; 
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Токен недействителен или истек.' });
    }
};

// 1. Настройка Multer для аватаров (без изменений)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed.'), false);
        }
    }
});


// 2. Функция серверной валидации (без изменений)
const validateRegistration = (name, email, password, confirmPassword) => {
    const errors = {};
    if (!name || name.length < 2) {
        errors.name = 'Имя должно быть не менее 2 символов.';
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        errors.email = 'Некорректный формат email.';
    }
    if (!password || password.length < 8) {
        errors.password = 'Пароль должен быть не менее 8 символов.';
    }
    if (password !== confirmPassword) {
        errors.confirmPassword = 'Пароли не совпадают.';
    }
    return errors;
};


// 3. ОБНОВЛЕННЫЙ Маршрут регистрации: POST /api/auth/register
router.post('/register', upload.single('avatarFile'), async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    const validationErrors = validateRegistration(name, email, password, confirmPassword);
    if (Object.keys(validationErrors).length > 0) {
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (e) { console.error('Failed to delete failed upload:', e); }
        }
        return res.status(400).json({ errors: validationErrors });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                avatarUrl: avatarPath,
            },
            select: { id: true, email: true, name: true, avatarUrl: true, isAdmin: true }
        });

        // ИЗМЕНЕНИЕ: Генерируем JWT и устанавливаем cookie
        // const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        // Устанавливаем cookie
        // res.cookie('authToken', token, COOKIE_OPTIONS);

        // Отправляем только данные пользователя (без токена)
        res.status(201).json({ 
            user: newUser, 
            message: 'Регистрация прошла успешно!' 
        });

    } catch (error) {
        if (req.file) { 
             try { await fs.unlink(req.file.path); } catch (e) { /* silent */ } 
        }
        if (error.code === 'P2002' && error.meta?.target.includes('email')) {
            return res.status(409).json({ errors: { email: 'Пользователь с таким email уже зарегистрирован.' } });
        }
        
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Произошла ошибка сервера при регистрации.' });
    }
});


// 4. ОБНОВЛЕННЫЙ Маршрут входа: POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ errors: { general: 'Email и пароль обязательны.' } });
    }
    
    try {
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                password: true,
                avatarUrl: true,
                isAdmin: true
            }
        });

        if (!user) {
            return res.status(401).json({ errors: { general: 'Неверный email или пароль.' } });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ errors: { general: 'Неверный email или пароль.' } });
        }
        
        // ИЗМЕНЕНИЕ: Генерируем JWT и устанавливаем cookie
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        
        // Устанавливаем cookie
        res.cookie('authToken', token, COOKIE_OPTIONS);

        // Убираем пароль из объекта
        const { password: _, ...userData } = user;

        // Отправляем только данные пользователя (без токена)
        res.json({ 
            user: userData, 
            message: 'Вход выполнен успешно!' 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Произошла ошибка сервера при входе.' });
    }
});


// 5. Маршрут для получения данных пользователя: GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, name: true, email: true, avatarUrl: true, isAdmin: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден.' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных.' });
    }
});


// 6. НОВЫЙ Маршрут для выхода: POST /api/auth/logout
router.post('/logout', (req, res) => {
    // Удаляем cookie, устанавливая maxAge в 0
    res.cookie('authToken', '', {
        ...COOKIE_OPTIONS,
        maxAge: 0
    });

    res.json({ message: 'Выход выполнен успешно!' });
});


// 7. Обновление профиля: PUT /api/auth/profile
router.put('/profile', protect, upload.single('avatarFile'), async (req, res) => {
    try {
        const userId = req.userId;
        const { name } = req.body;

        if (!name || name.trim().length < 2) {
            if (req.file) {
                try { await fs.unlink(req.file.path); } catch (e) { /* silent */ }
            }
            return res.status(400).json({ error: 'Имя должно содержать минимум 2 символа' });
        }

        const updateData = {
            name: name.trim()
        };

        // Если загружен новый аватар
        if (req.file) {
            // Удаляем старый аватар
            const oldUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { avatarUrl: true }
            });

            if (oldUser?.avatarUrl) {
                try {
                    await fs.unlink(`.${oldUser.avatarUrl}`);
                } catch (e) {
                    console.log('Старый аватар не найден или уже удален');
                }
            }

            updateData.avatarUrl = `/uploads/avatars/${req.file.filename}`;
        }

        // ИСПРАВЛЕНО: Убрано createdAt из select
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                isAdmin: true
            }
        });

        res.json({ 
            user: updatedUser, 
            message: 'Профиль успешно обновлен' 
        });

    } catch (error) {
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (e) { /* silent */ }
        }
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Не удалось обновить профиль' });
    }
});

// 8. Смена пароля: PUT /api/auth/password
router.put('/password', protect, async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Новый пароль должен быть не менее 8 символов' });
        }

        // Получаем текущего пользователя
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        // Проверяем текущий пароль
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный текущий пароль' });
        }

        // Хешируем новый пароль
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Пароль успешно изменен' });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Не удалось изменить пароль' });
    }
});

// 9. Удаление аккаунта: DELETE /api/auth/account
router.delete('/account', protect, async (req, res) => {
    try {
        const userId = req.userId;

        // Получаем пользователя с аватаром
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatarUrl: true }
        });

        // Удаляем аватар если есть
        if (user?.avatarUrl) {
            try {
                await fs.unlink(`.${user.avatarUrl}`);
            } catch (e) {
                console.log('Аватар не найден или уже удален');
            }
        }

        // Удаляем пользователя (каскадно удалятся комментарии, уведомления и т.д.)
        await prisma.user.delete({
            where: { id: userId }
        });

        // Удаляем cookie
        res.cookie('authToken', '', {
            ...COOKIE_OPTIONS,
            maxAge: 0
        });

        res.json({ message: 'Аккаунт успешно удален' });

    } catch (error) {
        console.error('Account deletion error:', error);
        res.status(500).json({ error: 'Не удалось удалить аккаунт' });
    }
});


// Настройка email-транспорта (после импортов)
const emailTransporter = nodemailer.createTransport({
    // Для Gmail
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Ваш email
        pass: process.env.EMAIL_PASSWORD // Пароль приложения Gmail
    }

    // Или для другого SMTP
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
    */
});

// Функция генерации случайного пароля
function generateRandomPassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        password += chars[randomBytes[i] % chars.length];
    }

    return password;
}

// Функция отправки email с красивым HTML
async function sendPasswordResetEmail(email, newPassword, userName) {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background: linear-gradient(135deg, #f7d90c 0%, #c21113 100%);
                padding: 40px 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .header {
                background: linear-gradient(135deg, #f7d90c 0%, #c21113 100%);
                padding: 40px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .header p {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
            }
            .content {
                padding: 40px;
            }
            .greeting {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
            }
            .message {
                color: #555;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .password-box {
                background: linear-gradient(135deg, #f5f7fa 0%, #e8ebf0 100%);
                border-radius: 12px;
                padding: 24px;
                text-align: center;
                margin: 30px 0;
                border: 2px solid #f7d90c;
            }
            .password-label {
                color: #666;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                font-weight: 600;
            }
            .password {
                font-size: 24px;
                font-weight: 700;
                color: #f7d90c;
                font-family: 'Courier New', monospace;
                letter-spacing: 2px;
                padding: 12px;
                background: white;
                border-radius: 8px;
                display: inline-block;
                user-select: all;
            }
            .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .warning-icon {
                color: #ffc107;
                font-size: 20px;
                margin-right: 8px;
            }
            .warning-text {
                color: #856404;
                font-size: 14px;
                line-height: 1.5;
            }
            .footer {
                background: #f8f9fa;
                padding: 30px 40px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                color: #6c757d;
                font-size: 14px;
                margin-bottom: 8px;
            }
            .footer-link {
                color: #f7d90c;
                text-decoration: none;
            }
            .security-info {
                background: #e7f3ff;
                border-left: 4px solid #f7d90c;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .security-text {
                color: #333;
                font-size: 14px;
                line-height: 1.5;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Восстановление пароля</h1>
                <p>Ваш новый пароль готов</p>
            </div>
            
            <div class="content">
                <p class="greeting">Здравствуйте, ${userName}!</p>
                
                <p class="message">
                    Вы запросили восстановление пароля для вашего аккаунта. 
                    Мы сгенерировали для вас новый безопасный пароль.
                </p>
                
                <div class="password-box">
                    <div class="password-label">Ваш новый пароль</div>
                    <div class="password">${newPassword}</div>
                </div>
                
                <div class="warning">
                    <div class="warning-text">
                        <span class="warning-icon">⚠️</span>
                        <strong>Важно:</strong> После входа в систему мы настоятельно рекомендуем 
                        изменить этот пароль на свой собственный в настройках профиля.
                    </div>
                </div>
                
                <div class="security-info">
                    <div class="security-text">
                        <strong>🛡️ Безопасность:</strong><br>
                        • Не сообщайте пароль другим людям<br>
                        • Используйте уникальный пароль для каждого сервиса<br>
                        • Регулярно меняйте пароль<br>
                        • Если вы не запрашивали восстановление, немедленно свяжитесь с поддержкой
                    </div>
                </div>
                
                <p class="message" style="margin-top: 30px;">
                    Если у вас возникли вопросы или проблемы со входом, 
                    пожалуйста, свяжитесь с нашей службой поддержки.
                </p>
            </div>
            
            <div class="footer">
                <p>С уважением, команда нашего сайта</p>
                <p>
                    <a href="http://localhost:5173" class="footer-link">Перейти на сайт</a>
                </p>
                <p style="margin-top: 20px; font-size: 12px; color: #999;">
                    Это автоматическое письмо, пожалуйста, не отвечайте на него.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"Ваш Сайт" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Восстановление пароля',
        html: htmlTemplate
    };

    await emailTransporter.sendMail(mailOptions);
}

// 10. НОВЫЙ МАРШРУТ: Восстановление пароля
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({
                error: 'Пожалуйста, укажите корректный email адрес.'
            });
        }

        // Проверяем существование пользователя
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, email: true, name: true }
        });

        if (!user) {
            return res.status(404).json({
                error: 'Пользователь с таким email не зарегистрирован.'
            });
        }

        // Генерируем новый пароль
        const newPassword = generateRandomPassword(12);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Обновляем пароль в БД
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Отправляем email
        await sendPasswordResetEmail(user.email, newPassword, user.name);

        res.json({
            success: true,
            message: 'Новый пароль отправлен на ваш email.'
        });

    } catch (error) {
        console.error('Password reset error:', error);

        // Обработка ошибок email
        if (error.code === 'EAUTH' || error.code === 'ESOCKET') {
            return res.status(500).json({
                error: 'Ошибка отправки email. Проверьте настройки почтового сервера.'
            });
        }

        res.status(500).json({
            error: 'Произошла ошибка при восстановлении пароля.'
        });
    }
});


export { protect };
export default router;