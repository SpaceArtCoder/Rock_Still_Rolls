import express from 'express';
import prisma from '../../prisma/client.js';
import multer from 'multer'; 
import path from 'path'; 
import fs from 'fs/promises'; 

const router = express.Router(); // Инициализация маршрутизатора Express

// 1. Настройка Multer для обработки загрузки изображений
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Указываем папку для хранения загруженных файлов
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Уникальное имя для файла
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Преобразуем имя файла, добавляя уникальный суффикс
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Ограничение на размер файла (5 MB)
});

// ------------------------------------
// A. CREATE: POST /api/articles
// ------------------------------------
router.post('/', upload.single('imageFile'), async (req, res) => {
    const { title, content, excerpt, slug, status, categoryName } = req.body; // Получаем данные из тела запроса
    const urlToImage = req.file ? `/uploads/${req.file.filename}` : undefined; // Сохраняем путь к изображению, если оно загружено

    // Проверяем, что все обязательные поля присутствуют
    if (!title || !content || !slug) {
        if (req.file) {
            try { await fs.unlink(req.file.path); } catch (err) { console.error('Failed to delete file:', err); }
        }
        return res.status(400).json({ error: 'Title, Content, and Slug are required fields.' });
    }

    try {
        // Определяем категории для статьи в зависимости от переданных данных
        let categoriesToConnect = [];

        if (categoryName === 'События') {
            categoriesToConnect = ['События', 'Новости'];
        } else if (categoryName === 'Исполнители') {
            categoriesToConnect = ['Исполнители'];
        } else {
            categoriesToConnect = ['Новости'];
        }

        // Создаем новую статью в базе данных через Prisma
        const newArticle = await prisma.article.create({
            data: {
                title, content, excerpt, slug,
                image: urlToImage,
                status: status || 'draft', // Если статус не передан, ставим 'draft' по умолчанию
                categories: {
                    create: categoriesToConnect.map(name => ({
                        category: {
                            connect: { name: name }
                        }
                    }))
                }
            },
            include: {
                categories: {
                    select: { category: { select: { name: true } } }
                }
            }
        });

        res.status(201).json(newArticle); // Возвращаем информацию о новой статье

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'The provided URL Slug already exists.' }); // Ошибка, если slug уже существует
        }
        if (error.message.includes('Record to connect was not found')) {
            return res.status(400).json({ error: `One of the required categories does not exist in the database.` });
        }
        res.status(500).json({ error: 'Failed to save the article.', details: error.message });
    }
});

// ------------------------------------
// INFINITE SCROLL PAGINATION
// GET /api/articles/paginated
// ------------------------------------
router.get('/paginated', async (req, res) => {
    const { category, cursor, limit = 10 } = req.query; // Получаем параметры запроса (категория, курсор, лимит)

    const take = parseInt(limit);
    const cursorId = cursor ? parseInt(cursor) : null;

    let categoryFilterName = category ? decodeURIComponent(category) : null; // Расшифровка категории

    let whereCondition = {};

    // Формируем условие для поиска по категории
    if (categoryFilterName) {
        if (categoryFilterName === 'Новости') {
            whereCondition.categories = {
                some: {
                    category: { name: 'Новости' }
                },
                none: {
                    category: { name: 'Исполнители' }
                }
            };
        } else {
            whereCondition.categories = {
                some: {
                    category: { name: categoryFilterName }
                }
            };
        }
    }

    try {
        // Получаем статьи с пагинацией
        const articles = await prisma.article.findMany({
            where: whereCondition,
            take: take + 1, // Загружаем на одну статью больше для определения наличия следующей страницы
            ...(cursorId && {
                skip: 1,
                cursor: { id: cursorId }
            }),
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                categories: {
                    select: {
                        category: {
                            select: { name: true }
                        }
                    }
                }
            }
        });

        const hasMore = articles.length > take;
        const resultArticles = hasMore ? articles.slice(0, -1) : articles; // Если есть больше, убираем лишнюю статью
        const nextCursor = hasMore ? resultArticles[resultArticles.length - 1].id : null;

        res.json({
            articles: resultArticles,
            nextCursor,
            hasMore
        });

    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch articles',
            details: error.message
        });
    }
});

// ------------------------------------
// SEARCH: GET /api/articles/search
// ------------------------------------
router.get('/search', async (req, res) => {
    const searchQuery = req.query.q;

    // Если поисковый запрос пустой, возвращаем пустой массив
    if (!searchQuery || searchQuery.trim() === '') {
        return res.json([]);
    }

    try {
        // Поиск по заголовку, содержимому и аннотации
        const articles = await prisma.$queryRaw`
            SELECT 
                a.id, 
                a.title, 
                a.slug, 
                a.excerpt, 
                a.image, 
                a.created_at as createdAt,
                GROUP_CONCAT(c.name) as categories,
                MATCH(a.title, a.content, a.excerpt) AGAINST(${searchQuery} IN NATURAL LANGUAGE MODE) as relevance
            FROM articles a
            LEFT JOIN article_categories ac ON a.id = ac.articleId
            LEFT JOIN categories c ON ac.categoryId = c.id
            WHERE a.status = 'published'
            AND MATCH(a.title, a.content, a.excerpt) AGAINST(${searchQuery} IN NATURAL LANGUAGE MODE)
            GROUP BY a.id, a.title, a.slug, a.excerpt, a.image, a.created_at
            ORDER BY relevance DESC, a.created_at DESC
            LIMIT 10
        `;

        // Форматируем результаты поиска
        const formattedArticles = articles.map(article => ({
            id: Number(article.id),
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt,
            image: article.image,
            createdAt: article.createdAt,
            categories: article.categories ? article.categories.split(',') : [],
            relevance: Number(article.relevance)
        }));

        res.json(formattedArticles);

    } catch (error) {
        res.status(500).json({ error: 'Search failed.', details: error.message });
    }
});

// ------------------------------------
// C. READ ONE: GET /api/articles/:slug
// ------------------------------------
router.get('/:slug', async (req, res) => {
    try {
        const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
        if (!article) return res.status(404).json({ message: "Article not found." });
        res.json(article);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve the article.", error: error.message });
    }
});

// ------------------------------------
// B. READ ALL: GET /api/articles?category=...
// ------------------------------------
router.get('/', async (req, res) => {
    const categoryQuery = req.query.category;
    const limitQuery = req.query.limit;

    let categoryFilterName = categoryQuery ? decodeURIComponent(categoryQuery) : null;
    let limit = limitQuery ? parseInt(limitQuery) : undefined;

    let whereCondition = {};

    // Фильтрация по категориям
    if (categoryFilterName) {
        if (categoryFilterName === 'Новости') {
            whereCondition.categories = {
                some: {
                    category: {
                        name: 'Новости'
                    }
                },
                none: {
                    category: {
                        name: 'Исполнители'
                    }
                }
            };
        } else {
            whereCondition.categories = {
                some: {
                    category: {
                        name: categoryFilterName
                    }
                }
            };
        }
    }

    try {
        // Получаем все статьи с возможностью фильтрации по категориям
        const articles = await prisma.article.findMany({
            where: whereCondition,
            orderBy: {
                createdAt: 'desc',
            },
            take: limit,
            include: {
                categories: {
                    select: { category: { select: { name: true } } }
                }
            }
        });
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve articles.", error: error.message });
    }
});

// ------------------------------------
// D. UPDATE: PUT /api/articles/:id
// ------------------------------------
router.put('/:id', upload.single('imageFile'), async (req, res) => {
    const articleId = parseInt(req.params.id);
    const { title, content, excerpt, slug, status, categoryName, oldImage } = req.body;
    const urlToImage = req.file ? `/uploads/${req.file.filename}` : oldImage;

    const articleUpdateData = {
        title,
        content,
        excerpt,
        slug,
        status,
        image: urlToImage,
        updatedAt: new Date(),
    };

    try {
        // Удаление старых категорий
        await prisma.articleOnCategory.deleteMany({
            where: { articleId: articleId },
        });

        let categoriesToConnect = [];

        const primaryCategory = await prisma.category.findUnique({
            where: { name: categoryName },
        });

        if (primaryCategory) {
            categoriesToConnect.push(primaryCategory.id);

            if (categoryName === 'События') {
                const newsCategory = await prisma.category.findUnique({
                    where: { name: 'Новости' },
                });
                if (newsCategory) {
                    categoriesToConnect.push(newsCategory.id);
                }
            }
        }

        // Добавление новых категорий
        const categoryData = categoriesToConnect.map(catId => ({
            articleId: articleId,
            categoryId: catId,
        }));

        if (categoryData.length > 0) {
            await prisma.articleOnCategory.createMany({
                data: categoryData,
                skipDuplicates: true,
            });
        }

        // Обновляем статью
        const updatedArticle = await prisma.article.update({
            where: { id: articleId },
            data: articleUpdateData,
        });

        res.json(updatedArticle);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Article not found.' });
        res.status(500).json({ error: 'Failed to update the article.', details: error.message });
    }
});

// ------------------------------------
// E. DELETE: DELETE /api/articles/:id
// ------------------------------------
router.delete('/:id', async (req, res) => {
    const articleId = parseInt(req.params.id);

    try {
        await prisma.article.delete({ where: { id: articleId } });
        res.status(200).json({ message: 'Article deleted successfully.' });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'Article not found.' });
        res.status(500).json({ error: 'Failed to delete the article.', details: error.message });
    }
});

// ------------------------------------
// F. UPLOAD IMAGE: POST /api/articles/upload-image
// ------------------------------------
router.post('/upload-image', upload.single('uploadFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, message: 'Image uploaded successfully.' });
});

export default router; 

