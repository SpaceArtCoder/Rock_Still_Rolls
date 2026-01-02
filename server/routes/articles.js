/**
 * РОУТЕР СТАТЕЙ (Articles API)
 * ----------------------------
 * Назначение: Создание, чтение, обновление, удаление (CRUD) статей,
 * а также обработка загрузки изображений на сервер.
 */

import express from 'express';
import prisma from '../../prisma/client.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// ==========================================
// 1. НАСТРОЙКА MULTER (Загрузка файлов)
// ==========================================

/**
 * Определение места хранения и имен файлов.
 * Файлы сохраняются в папку /uploads с уникальным ID во избежание перезаписи.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Генерируем имя: timestamp + случайное число + расширение оригинала
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Лимит: 5 МБ
});

// ==========================================
// 2. МАРШРУТЫ API (ENDPOINTS)
// ==========================================

/**
 * A. СОЗДАНИЕ: POST /api/articles
 * Принимает текстовые данные и один файл 'imageFile'.
 */

router.post('/', upload.single('imageFile'), async (req, res) => {
    const { title, content, excerpt, slug, status, categoryName } = req.body;
    const urlToImage = req.file ? `/uploads/${req.file.filename}` : undefined;

    // Валидация обязательных полей
    if (!title || !content || !slug) {
        // Если данные невалидны, но файл уже загружен — удаляем его
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (err) { console.error('Failed to delete file:', err); }
        }
        return res.status(400).json({ error: 'Title, Content, and Slug are required fields.' });
    }

    try {
        let categoriesToConnect = [];

        // Если указана категория, ищем её ID или создаем связь
        if (categoryName) {
            const category = await prisma.category.findUnique({
                where: { name: categoryName }
            });
            if (category) {
                categoriesToConnect.push({
                    category: { connect: { id: category.id } }
                });
            }
        }

        const newArticle = await prisma.article.create({
            data: {
                title,
                content,
                excerpt,
                slug,
                status: status || 'DRAFT',
                image: urlToImage,
                categories: { create: categoriesToConnect }
            },
        });
        res.status(201).json(newArticle);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create article.', details: error.message });
    }
});

/**
 * B. ПОЛУЧЕНИЕ ВСЕХ: GET /api/articles
 * Поддерживает полнотекстовый поиск через query-параметр ?search=
 */
router.get('/', async (req, res) => {
    const { search } = req.query;

    try {
        const articles = await prisma.article.findMany({
            where: search ? {
                OR: [
                    { title: { contains: search } },
                    { content: { contains: search } }
                ]
            } : {},
            include: {
                categories: { include: { category: true } },
                author: { select: { name: true, avatarUrl: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch articles.' });
    }
});

/**
 * C. ПОЛУЧЕНИЕ ОДНОЙ: GET /api/articles/:slug
 * Поиск по человекопонятному URL (slug) вместо ID.
 */
router.get('/:slug', async (req, res) => {
    try {
        const article = await prisma.article.findUnique({
            where: { slug: req.params.slug },
            include: {
                categories: { include: { category: true } },
                author: true
            }
        });
        if (!article) return res.status(404).json({ error: 'Article not found.' });
        res.json(article);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching article.' });
    }
});

/**
 * D. ОБНОВЛЕНИЕ: PUT /api/articles/:id
 */
router.put('/:id', upload.single('imageFile'), async (req, res) => {
    const articleId = parseInt(req.params.id);
    const { title, content, excerpt, slug, status } = req.body;

    try {
        const articleUpdateData = { title, content, excerpt, slug, status };
        if (req.file) articleUpdateData.image = `/uploads/${req.file.filename}`;

        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: articleUpdateData,
        });

        res.json(updatedArticle);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Article not found.' });
        res.status(500).json({ error: 'Failed to update article.' });
    }
});

/**
 * E. УДАЛЕНИЕ: DELETE /api/articles/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.article.delete({ where: { id } });
        res.status(200).json({ message: 'Article deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete article.' });
    }
});

/**
 * F. ЗАГРУЗКА ИЗ РЕДАКТОРА: POST /api/articles/upload-image
 * Специальный endpoint для вставки картинок прямо в тело статьи (например, через TinyMCE/CKEditor)
 */
router.post('/upload-image', upload.single('uploadFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    
    // Возвращаем путь к файлу, чтобы редактор мог отобразить картинку
    res.json({ location: `/uploads/${req.file.filename}` });
});

export default router;
