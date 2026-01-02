import { create } from 'zustand';
import axios from '../utils/axiosConfig';

// Базовый URL API комментариев
const API_BASE_URL = 'http://localhost:5000/api/comments';

/**
 * Преобразование плоского списка комментариев в древовидную структуру
 * @param {Array} comments - Массив комментариев в плоском формате
 * @returns {Array} Древовидная структура комментариев
 */
const buildCommentTree = (comments) => {
    const map = {};
    const tree = [];

    // Создаем карту комментариев
    comments.forEach(comment => {
        map[comment.id] = { ...comment, replies: [] };
    });

    // Строим иерархию комментариев
    comments.forEach(comment => {
        if (comment.parentId) {
            const parentComment = map[comment.parentId];
            if (parentComment) {
                parentComment.replies.push(map[comment.id]);
            }
        } else {
            tree.push(map[comment.id]);
        }
    });

    // Сортируем корневые комментарии по дате создания (новые сверху)
    tree.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return tree;
};

/**
 * Рекурсивное обновление комментария в древовидной структуре
 * @param {Array} comments - Массив комментариев
 * @param {string} commentId - ID комментария для обновления
 * @param {Object} updatedData - Новые данные комментария
 * @returns {Array} Обновленный массив комментариев
 */
const recursiveUpdate = (comments, commentId, updatedData) => {
    return comments.map(c => {
        if (c.id === commentId) {
            return {
                ...c,
                content: updatedData.content || c.content,
                likes: updatedData.likes !== undefined ? updatedData.likes : c.likes,
                dislikes: updatedData.dislikes !== undefined ? updatedData.dislikes : c.dislikes,
                updatedAt: updatedData.updatedAt || c.updatedAt
            };
        }
        if (c.replies && c.replies.length > 0) {
            return { ...c, replies: recursiveUpdate(c.replies, commentId, updatedData) };
        }
        return c;
    });
};

/**
 * Добавление нового комментария в древовидную структуру
 * @param {Array} comments - Массив комментариев
 * @param {Object} newComment - Новый комментарий
 * @param {string|null} parentId - ID родительского комментария (null для корневых)
 * @returns {Array} Обновленный массив комментариев
 */
const addCommentToTree = (comments, newComment, parentId) => {
    if (!parentId) {
        // Корневой комментарий - добавляем в начало списка
        return [{ ...newComment, replies: [] }, ...comments];
    }

    // Ответ на комментарий - ищем родителя рекурсивно
    return comments.map(c => {
        if (c.id === parentId) {
            return {
                ...c,
                replies: [...(c.replies || []), { ...newComment, replies: [] }]
            };
        }
        if (c.replies && c.replies.length > 0) {
            return {
                ...c,
                replies: addCommentToTree(c.replies, newComment, parentId)
            };
        }
        return c;
    });
};

/**
 * Удаление комментария из древовидной структуры
 * @param {Array} comments - Массив комментариев
 * @param {string} commentId - ID комментария для удаления
 * @returns {Array} Обновленный массив комментариев
 */
const removeCommentFromTree = (comments, commentId) => {
    return comments.reduce((acc, c) => {
        if (c.id === commentId) {
            return acc;
        }

        if (c.replies && c.replies.length > 0) {
            return [...acc, {
                ...c,
                replies: removeCommentFromTree(c.replies, commentId)
            }];
        }

        return [...acc, c];
    }, []);
};

/**
 * Хранилище комментариев на Zustand
 * Управляет загрузкой, добавлением, удалением и обновлением комментариев
 */
const useCommentStore = create((set, get) => ({
    // Состояние хранилища
    comments: [],               // Массив комментариев в древовидной структуре
    loading: false,             // Флаг загрузки данных
    error: null,                // Сообщение об ошибке
    currentArticleSlug: null,   // Slug текущей статьи

    /**
     * Загрузка комментариев для статьи по slug
     * @param {string} articleSlug - Slug статьи
     */
    fetchComments: async (articleSlug) => {
        set({ loading: true, error: null, currentArticleSlug: articleSlug });
        try {
            const response = await axios.get(`${API_BASE_URL}/${articleSlug}`);
            const threadedComments = buildCommentTree(response.data);
            set({ comments: threadedComments, loading: false });
        } catch (error) {
            console.error("Ошибка при загрузке комментариев:", error);
            set({ 
                error: error.response?.data?.error || 'Не удалось загрузить комментарии.', 
                loading: false 
            });
        }
    },

    /**
     * Добавление нового комментария
     * @param {string} articleSlug - Slug статьи
     * @param {string} content - Текст комментария
     * @param {string|null} parentId - ID родительского комментария (null для корневых)
     * @returns {Object|null} Добавленный комментарий или null при ошибке
     */
    addComment: async (articleSlug, content, parentId) => {
        try {
            const response = await axios.post(API_BASE_URL, {
                articleSlug,
                content,
                parentId
            });

            const newComment = response.data;

            // Добавляем комментарий в древовидную структуру
            set(state => ({
                comments: addCommentToTree(state.comments, newComment, parentId)
            }));

            return newComment;

        } catch (error) {
            console.error("Ошибка при добавлении комментария:", error);

            if (error.response?.status === 401) {
                get().setError('Необходимо авторизоваться для комментирования.');
            } else {
                get().setError('Не удалось добавить комментарий.');
            }

            return null;
        }
    },

    /**
     * Удаление комментария
     * @param {string} commentId - ID комментария для удаления
     * @param {string} articleSlug - Slug статьи (для валидации)
     */
    deleteComment: async (commentId, articleSlug) => {
        try {
            await axios.delete(`${API_BASE_URL}/${commentId}`);

            // Удаляем комментарий из древовидной структуры
            set(state => ({
                comments: removeCommentFromTree(state.comments, commentId)
            }));

        } catch (error) {
            console.error("Ошибка при удалении комментария:", error);
            get().setError(error.response?.data?.error || 'Не удалось удалить комментарий.');
        }
    },

    /**
     * Обновление существующего комментария
     * @param {string} commentId - ID комментария для обновления
     * @param {string} content - Новый текст комментария
     * @returns {Object|null} Обновленный комментарий или null при ошибке
     */
    updateComment: async (commentId, content) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/${commentId}`, { content });
            const updatedCommentData = response.data;

            set(state => ({
                comments: recursiveUpdate(state.comments, commentId, updatedCommentData)
            }));

            return updatedCommentData;

        } catch (error) {
            console.error("Ошибка при обновлении комментария:", error);

            if (error.response?.status === 401) {
                get().setError('Необходимо авторизоваться для редактирования.');
            } else {
                get().setError(error.response?.data?.error || 'Не удалось обновить комментарий.');
            }

            return null;
        }
    },

    /**
     * Голосование за комментарий (лайк/дизлайк)
     * @param {string} commentId - ID комментария
     * @param {string} type - Тип голоса ('like' или 'dislike')
     */
    voteComment: async (commentId, type) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/${commentId}/vote`, { type });
            const updatedCommentData = response.data.comment;

            set(state => ({
                comments: recursiveUpdate(state.comments, commentId, updatedCommentData)
            }));

        } catch (error) {
            console.error("Ошибка при голосовании:", error);

            if (error.response?.status === 401) {
                get().setError('Необходимо авторизоваться для голосования.');
            } else {
                get().setError('Не удалось проголосовать.');
            }
        }
    },

    /**
     * Установка сообщения об ошибке
     * @param {string} message - Текст сообщения об ошибке
     */
    setError: (message) => set({ error: message }),
    
    /**
     * Очистка сообщения об ошибке
     */
    clearError: () => set({ error: null }),

}));

export default useCommentStore;
