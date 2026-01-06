// server/routes/notifications.js
import express from 'express';
import prisma from '../../prisma/client.js';
import { protect } from './auth.js'; // Импортируем middleware авторизации

const router = express.Router();

// ========================================
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ
// ========================================

/**
 * Создает уведомление в базе данных
 * @param {Object} data - Данные уведомления
 * @param {number} data.userId - ID пользователя-получателя
 * @param {string} data.type - Тип уведомления
 * @param {string} data.message - Текст уведомления
 * @param {string} [data.link] - Ссылка (опционально)
 * @param {number} [data.fromUserId] - ID отправителя (опционально)
 * @param {number} [data.commentId] - ID комментария (опционально)
 */
export const createNotification = async (data) => {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                message: data.message,
                link: data.link || null,
                fromUserId: data.fromUserId || null,
                commentId: data.commentId || null,
            }
        });
    } catch (error) {
        console.error('Ошибка создания уведомления:', error);
    }
};

// ========================================
// МАРШРУТЫ API
// ========================================

// 1. Получить все уведомления текущего пользователя
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: req.userId
            },
            include: {
                fromUser: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                },
                comment: {
                    select: {
                        id: true,
                        content: true,
                        article: { // <-- ИСПРАВЛЕНИЕ: Включаем связанную статью
                            select: { // <-- ИСПРАВЛЕНИЕ: Выбираем ее слаг
                                slug: true 
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Последние 50 уведомлений
        });

        res.json(notifications);
    } catch (error) {
        console.error('Ошибка получения уведомлений:', error);
        res.status(500).json({ error: 'Не удалось загрузить уведомления' });
    }
});

// 2. Получить количество непрочитанных уведомлений
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await prisma.notification.count({
            where: {
                userId: req.userId,
                read: false
            }
        });

        res.json({ count });
    } catch (error) {
        console.error('Ошибка подсчета непрочитанных:', error);
        res.status(500).json({ error: 'Не удалось получить количество' });
    }
});

// 3. Отметить уведомление как прочитанное
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        // Проверяем, что уведомление принадлежит пользователю
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: req.userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        res.json(updated);
    } catch (error) {
        console.error('Ошибка обновления уведомления:', error);
        res.status(500).json({ error: 'Не удалось обновить уведомление' });
    }
});

// 4. Отметить все уведомления как прочитанные
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.userId,
                read: false
            },
            data: {
                read: true
            }
        });

        res.json({ message: 'Все уведомления отмечены как прочитанные' });
    } catch (error) {
        console.error('Ошибка обновления уведомлений:', error);
        res.status(500).json({ error: 'Не удалось обновить уведомления' });
    }
});

// 6. Удалить все прочитанные уведомления
router.delete('/clear-read', protect, async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                userId: req.userId,
                read: true
            }
        });

        res.json({ message: 'Прочитанные уведомления удалены' });
    } catch (error) {
        console.error('Ошибка удаления уведомлений:', error);
        res.status(500).json({ error: 'Не удалось удалить уведомления' });
    }
});


// 5. Удалить уведомление
router.delete('/:id', protect, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        // --- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ #1: Валидация ID ---
        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'Неверный ID уведомления.' });
        }
        // ---------------------------------------------------

        // Проверяем, что уведомление принадлежит пользователю
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: req.userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' });
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ message: 'Уведомление удалено' });
    } catch (error) {
        console.error('Ошибка удаления уведомления:', error);
        res.status(500).json({ error: 'Не удалось удалить уведомление' });
    }
});

export default router;