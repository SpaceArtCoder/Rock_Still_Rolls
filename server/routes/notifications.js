/**
 * РОУТЕР УВЕДОМЛЕНИЙ (Notifications API)
 * --------------------------------------
 * Назначение: Управление системными уведомлениями пользователя.
 * Модуль содержит вспомогательную функцию для создания уведомлений 
 * из других частей системы (комментарии, лайки).
 */

import express from 'express';
import prisma from '../../prisma/client.js';
import { protect } from './auth.js'; 

const router = express.Router();

// ==========================================
// 1. ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ (Exported)
// ==========================================

/**
 * createNotification
 * Используется внутри сервера (в роутерах статей/комментариев).
 * Не является маршрутом API, а служит для записи события в БД.
 */

export const createNotification = async (data) => {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,         // Кому придет
                type: data.type,             // Например: 'COMMENT_LIKE', 'REPLY'
                message: data.message,       // Текст для отображения
                link: data.link || null,     // Куда перейдет юзер при клике
                fromUserId: data.fromUserId || null, // Кто инициировал (актор)
                commentId: data.commentId || null,   // Привязка к объекту (если есть)
            }
        });
    } catch (error) {
        console.error('Ошибка создания уведомления:', error);
    }
};

// ==========================================
// 2. МАРШРУТЫ API (Доступны фронтенду)
// ==========================================

/**
 * ПОЛУЧЕНИЕ: GET /api/notifications
 * Возвращает список уведомлений для текущего авторизованного пользователя.
 */
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            include: {
                // Подтягиваем данные того, кто вызвал уведомление (аватар, имя)
                fromUser: {
                    select: { name: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'desc' } // Сначала самые свежие
        });

        res.json(notifications);
    } catch (error) {
        console.error('Ошибка получения уведомлений:', error);
        res.status(500).json({ error: 'Не удалось загрузить уведомления' });
    }
});

/**
 * ПРОЧИТАТЬ ВСЕ: PATCH /api/notifications/read-all
 * Массовое обновление статуса 'read' для всех уведомлений пользователя.
 */
router.patch('/read-all', protect, async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.userId,
                read: false
            },
            data: { read: true }
        });
        res.json({ message: 'Все уведомления помечены как прочитанные' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при обновлении статуса' });
    }
});

/**
 * УДАЛИТЬ ПРОЧИТАННЫЕ: DELETE /api/notifications/clean
 * Очистка базы данных от старых уведомлений, которые юзер уже видел.
 */
router.delete('/clean', protect, async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                userId: req.userId,
                read: true
            }
        });
        res.json({ message: 'Прочитанные уведомления удалены' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось очистить уведомления' });
    }
});

/**
 * УДАЛИТЬ ОДНО: DELETE /api/notifications/:id
 * Удаление конкретного уведомления с проверкой прав доступа.
 */
router.delete('/:id', protect, async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);

        if (isNaN(notificationId)) {
            return res.status(400).json({ error: 'Неверный ID уведомления.' });
        }

        // КРИТИЧНО: Проверяем, что уведомление принадлежит именно этому пользователю
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId: req.userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Уведомление не найдено или доступ запрещен' });
        }

        await prisma.notification.delete({
            where: { id: notificationId }
        });

        res.json({ message: 'Уведомление удалено' });
    } catch (error) {
        res.status(500).json({ error: 'Не удалось удалить уведомление' });
    }
});

export default router;
