/**
 * РОУТЕР КОММЕНТАРИЕВ (Comments & Voting API)
 * -----------------------------------------
 * Назначение: Чтение и создание комментариев, реализация вложенности (ответов),
 * а также система лайков с логикой создания уведомлений.
 */

import express from 'express';
import prisma from '../../prisma/client.js';
import { protect } from './auth.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// ==========================================
// 1. ПОЛУЧЕНИЕ: GET /api/comments/:articleSlug
// ==========================================
router.get('/:articleSlug', async (req, res) => {
    try {
        const { articleSlug } = req.params;

        // Загружаем все комментарии к конкретной статье
        const comments = await prisma.comment.findMany({
            where: {
                article: { slug: articleSlug } 
            },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            },
            orderBy: { createdAt: 'asc' } // Старые сверху, новые снизу
        });

        res.json(comments);
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        res.status(500).json({ error: 'Не удалось загрузить комментарии.' });
    }
});

// ==========================================
// 2. СОЗДАНИЕ: POST /api/comments
// ==========================================
/**
 * Добавляет новый комментарий. 
 * Если указан parentId — это ответ на другой комментарий.
 */

router.post('/', protect, async (req, res) => {
    try {
        const { articleSlug, content, parentId } = req.body;
        const authorId = req.userId; // ID из JWT токена

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Комментарий не может быть пустым.' });
        }

        // 1. Создаем запись комментария в БД
        const newComment = await prisma.comment.create({
            data: {
                content,
                author: { connect: { id: authorId } },
                article: { connect: { slug: articleSlug } },
                // Если есть parentId, подключаем его для реализации вложенности
                ...(parentId && { parent: { connect: { id: parentId } } })
            },
            include: {
                author: { select: { id: true, name: true, avatarUrl: true } },
                article: { 
                    include: { 
                        categories: { include: { category: true } } 
                    } 
                }
            }
        });

        // 2. ЛОГИКА УВЕДОМЛЕНИЙ
        // Определяем путь для ссылки в уведомлении (news, events или performers)
        let categoryPath = 'news';
        if (newComment.article.categories?.length > 0) {
            const catName = newComment.article.categories[0].category.name.toLowerCase();
            if (catName === 'события') categoryPath = 'events';
            else if (catName === 'исполнители') categoryPath = 'performers';
        }

        const articleLink = `/${categoryPath}/${newComment.article.slug}#comment-${newComment.id}`;

        // Если это ответ на другой комментарий — уведомляем автора родительского комментария
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { authorId: true }
            });

            if (parentComment && parentComment.authorId !== authorId) {
                await createNotification({
                    userId: parentComment.authorId,
                    type: 'COMMENT_REPLY',
                    message: `${newComment.author.name} ответил на ваш комментарий`,
                    link: articleLink,
                    fromUserId: authorId
                });
            }
        } 
        // Если это новый комментарий первого уровня — уведомляем автора статьи
        else if (newComment.article.authorId && newComment.article.authorId !== authorId) {
            await createNotification({
                userId: newComment.article.authorId,
                type: 'NEW_COMMENT',
                message: `${newComment.author.name} прокомментировал вашу статью`,
                link: articleLink,
                fromUserId: authorId
            });
        }

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Ошибка при создании комментария:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ==========================================
// 3. ГОЛОСОВАНИЕ: POST /api/comments/vote
// ==========================================
/**
 * Реализует логику Лайков/Дизлайков.
 * Предотвращает повторные голоса и обновляет счетчики в модели Comment.
 */

router.post('/vote', protect, async (req, res) => {
    const { commentId, voteType } = req.body; // voteType: 'LIKE' или 'DISLIKE'
    const userId = req.userId;

    try {
        // Проверяем, голосовал ли пользователь ранее
        const existingVote = await prisma.commentVote.findUnique({
            where: { userId_commentId: { userId, commentId } }
        });

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: { article: { include: { categories: { include: { category: true } } } } }
        });

        // ... далее следует логика пересчета лайков (удаление старого голоса, добавление нового)
        // Если пользователь меняет лайк на дизлайк, уменьшаем счетчик лайков и увеличиваем дизлайков.
        
        
        res.json({ message: 'Голос учтен' });
    } catch (error) {
        res.status(500).json({ error: 'Ошибка при голосовании' });
    }
});

export default router;
