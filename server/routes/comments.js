import express from 'express'; 
import prisma from '../../prisma/client.js'; 
import { protect } from './auth.js'; 
import { createNotification } from './notifications.js'; 

const router = express.Router(); // Инициализация маршрутизатора Express

// 1. Получить все комментарии для статьи
router.get('/:articleSlug', async (req, res) => {
    try {
        const { articleSlug } = req.params; // Получаем slug статьи из параметров

        // Получаем все комментарии для статьи, сортируя по дате
        const comments = await prisma.comment.findMany({
            where: {
                article: {
                    slug: articleSlug // Фильтрация по slug статьи
                } 
            },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true } // Включаем информацию об авторе комментария
                }
            },
            orderBy: { createdAt: 'asc' } // Сортировка по дате создания
        });

        res.json(comments); // Отправляем комментарии в ответ
    } catch (error) {
        console.error('Ошибка при загрузке комментариев:', error);
        res.status(500).json({ error: 'Не удалось загрузить комментарии.' });
    }
});

// 2. Добавить комментарий (с уведомлениями)
router.post('/', protect, async (req, res) => {
    try {
        const { articleSlug, content, parentId } = req.body; // Получаем данные из тела запроса
        const authorId = req.userId; // Получаем ID текущего пользователя из middleware protect

        // Проверка, что комментарий не пустой
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Комментарий не может быть пустым.' });
        }

        // Получаем статью, к которой добавляется комментарий
        const article = await prisma.article.findUnique({
            where: { slug: articleSlug },
            select: { 
                id: true, 
                authorId: true, // Получаем ID автора статьи
                categories: { select: { category: { select: { name: true } } } } // Получаем категории статьи
            }
        });

        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена.' });
        }

        const articleId = article.id;

        // Создаем новый комментарий
        const newComment = await prisma.comment.create({
            data: {
                content,
                articleId,
                authorId,
                parentId: parentId || null // Если это ответ на другой комментарий, сохраняем parentId
            },
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true }
                }
            }
        });

        // ========================================
        // СОЗДАНИЕ УВЕДОМЛЕНИЙ
        // ========================================
        let categoryPath = 'news'; // По умолчанию категория 'news'
        if (article.categories && article.categories.length > 0) {
            const categoryName = article.categories[0].category.name.toLowerCase();
            if (categoryName === 'события') categoryPath = 'events';
            else if (categoryName === 'исполнители') categoryPath = 'performers';
        }

        const articleLink = `/${categoryPath}/${articleSlug}#comment-${newComment.id}`;

        if (parentId) {
            // Ответ на комментарий
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { authorId: true, content: true }
            });

            if (parentComment && parentComment.authorId !== authorId) {
                await createNotification({
                    userId: parentComment.authorId, // Отправляем уведомление автору родительского комментария
                    type: 'COMMENT_REPLY',
                    message: `${newComment.author.name} ответил на ваш комментарий`,
                    link: articleLink,
                    fromUserId: authorId,
                    commentId: newComment.id,
                });
            }
        } else if (article.authorId && article.authorId !== authorId) {
            // Новый комментарий к статье
            await createNotification({
                userId: article.authorId, // Уведомление автору статьи
                type: 'NEW_COMMENT',
                message: `${newComment.author.name} прокомментировал вашу статью`,
                link: articleLink,
                fromUserId: authorId,
                commentId: newComment.id,
            });
        }

        res.status(201).json(newComment); // Возвращаем созданный комментарий

    } catch (error) {
        console.error('Ошибка при создании комментария:', error);
        res.status(500).json({ error: 'Не удалось создать комментарий.' });
    }
});

// 3. Обновить комментарий
router.put('/:id', protect, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id); // Получаем ID комментария
        const { content } = req.body; // Получаем новое содержание комментария
        const userId = req.userId; // Получаем ID пользователя

        // Проверка, что содержание комментария не пустое
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Комментарий не может быть пустым.' });
        }

        // Получаем комментарий по ID
        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден.' });
        }

        if (comment.authorId !== userId) {
            return res.status(403).json({ error: 'У вас нет прав на редактирование этого комментария.' });
        }

        // Обновляем комментарий
        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content }
        });

        res.json(updatedComment); // Возвращаем обновленный комментарий
    } catch (error) {
        console.error('Ошибка при обновлении комментария:', error);
        res.status(500).json({ error: 'Не удалось обновить комментарий.' });
    }
});

// 4. Удалить комментарий
router.delete('/:id', protect, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id); // Получаем ID комментария
        const userId = req.userId; // Получаем ID пользователя

        // Получаем комментарий по ID
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                author: { select: { id: true } } // Включаем информацию о владельце комментария
            }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Комментарий не найден.' });
        }

        // Получаем данные пользователя
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true } // Проверяем, является ли пользователь администратором
        });

        if (comment.authorId !== userId && !user.isAdmin) {
            return res.status(403).json({ error: 'У вас нет прав на удаление этого комментария.' });
        }

        // Удаляем комментарий
        await prisma.comment.delete({
            where: { id: commentId }
        });

        res.json({ message: 'Комментарий удалён.' }); // Возвращаем сообщение об успешном удалении
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        res.status(500).json({ error: 'Не удалось удалить комментарий.' });
    }
});

// 5. Голосование (с уведомлениями о лайках)
router.post('/:id/vote', protect, async (req, res) => {
    const commentId = parseInt(req.params.id); // Получаем ID комментария
    const userId = req.userId; // Получаем ID пользователя
    const { type } = req.body; // Тип голоса (LIKE или DISLIKE)

    if (type !== 'LIKE' && type !== 'DISLIKE') {
        return res.status(400).json({ error: 'Invalid vote type.' });
    }

    try {
        // Проверяем, есть ли уже голос от пользователя
        const existingVote = await prisma.commentVote.findUnique({
            where: { userId_commentId: { userId, commentId } }
        });

        // Получаем информацию о комментарии
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                author: { select: { id: true, name: true } }, // Информация об авторе комментария
                article: {
                    select: {
                        slug: true,
                        categories: {
                            select: {
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found.' });
        }

        let newComment, message;
        let shouldNotify = false;

        if (existingVote) {
            if (existingVote.type === type) {
                // Отмена голоса
                await prisma.commentVote.delete({
                    where: { userId_commentId: { userId, commentId } }
                });
                
                newComment = await prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        [type.toLowerCase() === 'like' ? 'likes' : 'dislikes']: { decrement: 1 }
                    }
                });
                message = 'Vote removed.';
            } else {
                // Смена голоса
                await prisma.commentVote.update({
                    where: { userId_commentId: { userId, commentId } },
                    data: { type }
                });
                
                const oldType = existingVote.type.toLowerCase() === 'like' ? 'likes' : 'dislikes';
                const newType = type.toLowerCase() === 'like' ? 'likes' : 'dislikes';

                newComment = await prisma.comment.update({
                    where: { id: commentId },
                    data: {
                        [oldType]: { decrement: 1 },
                        [newType]: { increment: 1 }
                    }
                });
                message = 'Vote changed.';
                
                if (type === 'LIKE' && comment.authorId !== userId) {
                    shouldNotify = true;
                }
            }
        } else {
            // Первый голос
            await prisma.commentVote.create({
                data: { userId, commentId, type }
            });
            
            newComment = await prisma.comment.update({
                where: { id: commentId },
                data: {
                    [type.toLowerCase() === 'like' ? 'likes' : 'dislikes']: { increment: 1 }
                }
            });
            message = 'Vote cast.';
            
            if (type === 'LIKE' && comment.authorId !== userId) {
                shouldNotify = true;
            }
        }

        // ========================================
        // СОЗДАНИЕ УВЕДОМЛЕНИЯ О ЛАЙКЕ
        // ========================================
        if (shouldNotify) {
            const liker = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });

            let categoryPath = 'news';
            if (comment.article.categories && comment.article.categories.length > 0) {
                const categoryName = comment.article.categories[0].category.name.toLowerCase();
                if (categoryName === 'события') categoryPath = 'events';
                else if (categoryName === 'исполнители') categoryPath = 'performers';
            }

            const articleLink = `/${categoryPath}/${comment.article.slug}#comment-${commentId}`;

            await createNotification({
                userId: comment.authorId,
                type: 'COMMENT_LIKE',
                message: `${liker.name} оценил ваш комментарий`,
                link: articleLink,
                fromUserId: userId,
                commentId: commentId,
            });
        }

        res.json({ comment: newComment, message });
    } catch (error) {
        console.error('Voting error:', error);
        res.status(500).json({ error: 'Failed to process vote.', details: error.message });
    }
});

export default router;

