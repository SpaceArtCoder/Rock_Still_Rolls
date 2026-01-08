import express from 'express'; 
import prisma from '../../prisma/client.js'; 
import { protect } from './auth.js'; 

const router = express.Router(); // Инициализация маршрутизатора Express

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
                userId: data.userId, // ID пользователя, которому отправляется уведомление
                type: data.type, // Тип уведомления (например, 'NEW_COMMENT', 'COMMENT_REPLY')
                message: data.message, // Сообщение уведомления
                link: data.link || null, // Ссылка на статью или комментарий (опционально)
                fromUserId: data.fromUserId || null, // ID отправителя (опционально)
                commentId: data.commentId || null, // ID комментария (если это связано с комментарием)
            }
        });
    } catch (error) {
        console.error('Ошибка создания уведомления:', error); // Логирование ошибок при создании уведомлений
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
                userId: req.userId // Фильтрация уведомлений по ID текущего пользователя
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
                        article: { 
                            select: { 
                                slug: true 
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc' // Сортировка уведомлений по дате (от новых к старым)
            },
            take: 50 // Ограничиваем вывод последних 50 уведомлений
        });

        res.json(notifications); // Отправляем уведомления в ответ
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
                userId: req.userId, // Подсчитываем уведомления для текущего пользователя
                read: false // Только непрочитанные уведомления
            }
        });

        res.json({ count }); // Возвращаем количество непрочитанных уведомлений
    } catch (error) {
        console.error('Ошибка подсчета непрочитанных:', error);
        res.status(500).json({ error: 'Не удалось получить количество' });
    }
});

// 3. Отметить уведомление как прочитанное
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id); // Получаем ID уведомления из параметров

        // Проверяем, что уведомление принадлежит пользователю
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: req.userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено' }); // Если уведомление не найдено
        }

        // Обновляем статус уведомления (помечаем как прочитанное)
        const updated = await prisma.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        res.json(updated); // Возвращаем обновленное уведомление
    } catch (error) {
        console.error('Ошибка обновления уведомления:', error);
        res.status(500).json({ error: 'Не удалось обновить уведомление' });
    }
});

// 4. Отметить все уведомления как прочитанные
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        // Обновляем все непрочитанные уведомления для текущего пользователя
        await prisma.notification.updateMany({
            where: {
                userId: req.userId,
                read: false // Только непрочитанные уведомления
            },
            data: {
                read: true // Отметить как прочитанные
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
        // Удаляем все прочитанные уведомления для текущего пользователя
        await prisma.notification.deleteMany({
            where: {
                userId: req.userId,
                read: true // Только прочитанные уведомления
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
        const notificationId = parseInt(req.params.id); // Получаем ID уведомления

        // --- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ #1: Валидация ID ---
        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'Неверный ID уведомления.' }); // Если ID некорректный
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
            return res.status(404).json({ error: 'Уведомление не найдено' }); // Если уведомление не найдено
        }

        // Удаляем уведомление
        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ message: 'Уведомление удалено' }); // Возвращаем сообщение об успешном удалении
    } catch (error) {
        console.error('Ошибка удаления уведомления:', error);
        res.status(500).json({ error: 'Не удалось удалить уведомление' });
    }
});

export default router;
 
