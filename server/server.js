import 'dotenv/config'; 
import prisma from '../prisma/client.js'; 
import express from 'express'; 
import bodyParser from 'body-parser'; 
import cors from 'cors'; 
import cookieParser from 'cookie-parser'; 

// Импорт маршрутов
import notificationRoutes from './routes/notifications.js'; 
import articleRoutes from './routes/articles.js'; 
import authRoutes from './routes/auth.js'; 
import commentRoutes from './routes/comments.js'; 
import oauthRoutes from './routes/oauth.js'; // Маршруты для OAuth

// Инициализация приложения Express
const app = express();
const port = 5000; // Порт, на котором будет работать сервер

// Настройка CORS для разрешения запросов с frontend'а на порту 5173
app.use(cors({
  origin: 'http://localhost:5173', // Разрешаем доступ с этого домена
  credentials: true, // Разрешаем передачу cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Разрешенные HTTP методы
  allowedHeaders: ['Content-Type', 'Authorization'] // Разрешенные заголовки
}));

// Миддлвар для парсинга cookies
app.use(cookieParser());

// Статическая обработка файлов, загруженных на сервер (например, изображения)
app.use('/uploads', express.static('uploads')); 
app.use('/uploads/avatars', express.static('uploads/avatars'));

// Миддлвар для парсинга JSON данных из тела запроса
app.use(bodyParser.json());

// Подключение маршрутов
app.use('/api/articles', articleRoutes); // Маршрут для работы с статьями
app.use('/api/auth', authRoutes); // Маршрут для аутентификации
app.use('/api/comments', commentRoutes); // Маршрут для работы с комментариями
app.use('/api/notifications', notificationRoutes); // Маршрут для работы с уведомлениями
app.use('/api/oauth', oauthRoutes); // Маршрут для работы с OAuth (Google & GitHub)

// Маршрут для создания новой категории
app.post('/api/categories', async (req, res) => {
  const { name } = req.body; // Извлекаем имя категории из тела запроса
  try {
    // Создание новой категории в базе данных с использованием Prisma
    const newCategory = await prisma.category.create({
      data: {
        name: name, // Записываем имя категории
      },
    });
    res.status(201).json(newCategory); // Возвращаем созданную категорию
  } catch (error) {
    // Обработка ошибок при создании категории
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Category with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create category', details: error.message }); // Общая ошибка
  }
});

// Маршрут для проверки состояния сервера и подключения к базе данных
app.get('/api/status', async (req, res) => {
  try {
    // Пытаемся выполнить запрос к базе данных для проверки подключения
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', db: 'Connected to MySQL via Prisma' }); // Если успешно, возвращаем статус
  } catch (error) {
    console.error('DB Connection Failed:', error); // Логируем ошибку подключения
    res.status(500).json({ status: 'Error', db: 'Connection failed' }); // Возвращаем ошибку
  }
});

// Запуск сервера на порту 5000
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Cookie-based authentication enabled ✓');
    console.log('OAuth (Google & GitHub) enabled ✓');
});

