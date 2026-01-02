/**
 * ГЛАВНЫЙ ФАЙЛ СЕРВЕРА (Express.js)
 * --------------------------------
 * Назначение: Инициализация сервера, настройка безопасности (CORS), 
 * подключение парсеров, статических папок и маршрутизация API.
 */

import 'dotenv/config';
import prisma from '../prisma/client.js'; 
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// ИМПОРТ РОУТЕРОВ (Маршрутизация по сущностям)
import notificationRoutes from './routes/notifications.js'; 
import articleRoutes from './routes/articles.js'; 
import authRoutes from './routes/auth.js';
import commentRoutes from './routes/comments.js';
import oauthRoutes from './routes/oauth.js';

const app = express();
const port = process.env.PORT || 5000; 

// ==========================================
// MIDDLEWARE (Промежуточное ПО)
// ==========================================

/**
 * Настройка CORS (Cross-Origin Resource Sharing)
 * Необходима для того, чтобы фронтенд (Vite/React) мог делать запросы к API.
 */
app.use(cors({
  origin: 'http://localhost:5173', // Адрес фронтенда
  credentials: true,               // КРИТИЧНО: Позволяет серверу принимать и отправлять Cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Парсер Cookies (извлекает данные из заголовков Cookie)
app.use(cookieParser());

/**
 * РАЗДАЧА СТАТИКИ
 * Позволяет обращаться к файлам в папке /uploads напрямую через URL
 * Например: http://localhost:5000/uploads/image.jpg
 */
app.use('/uploads', express.static('uploads')); 
app.use('/uploads/avatars', express.static('uploads/avatars'));

// Парсер тела запроса (преобразует JSON-тело запроса в объект req.body)
app.use(bodyParser.json());

// ==========================================
// МАРШРУТЫ API (ROUTES)
// ==========================================

app.use('/api/articles', articleRoutes);      // Работа со статьями
app.use('/api/auth', authRoutes);              // Локальная авторизация (Login/Register)
app.use('/api/comments', commentRoutes);       // Комментарии и голоса
app.use('/api/notifications', notificationRoutes); // Уведомления пользователей
app.use('/api/oauth', oauthRoutes);            // Авторизация через Google/GitHub

/**
 * МАРШРУТ: Создание категории
 * Вынесен в основной файл для примера/тестов. 
 */
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  try {
    const newCategory = await prisma.category.create({
      data: { name: name },
    });
    res.status(201).json(newCategory);
  } catch (error) {
    // P2002 - ошибка уникальности Prisma (если такая категория уже есть)
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create category', details: error.message });
  }
});

/**
 * МАРШРУТ: Проверка статуса (Health Check)
 * Используется для мониторинга доступности сервера и БД.
 */
app.get('/api/status', async (req, res) => {
  try {
    // Простая проверка связи с базой данных MySQL
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', db: 'Connected to MySQL via Prisma' });
  } catch (error) {
    console.error('DB Connection Failed:', error);
    res.status(500).json({ status: 'Error', db: 'Disconnected' });
  }
});

// ЗАПУСК СЕРВЕРА
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
