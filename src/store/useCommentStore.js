// src/store/useCommentStore.js (ЧИСТАЯ ВЕРСИЯ - БЕЗ СОХРАНЕНИЯ СКРОЛЛА)
import { create } from 'zustand';
import axios from '../utils/axiosConfig';

const API_BASE_URL = 'https://uncramped-robbin-patrimonial.ngrok-free.dev/api/comments';

// --- ФУНКЦИЯ УТИЛИТА 1: Преобразование плоского списка в дерево ---
const buildCommentTree = (comments) => {
    const map = {};
    const tree = [];

    comments.forEach(comment => {
        map[comment.id] = { ...comment, replies: [] };
    });

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

    tree.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return tree;
};

// --- ФУНКЦИЯ УТИЛИТА 2: Рекурсивное обновление ---
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

// --- ФУНКЦИЯ УТИЛИТА 3: Добавление комментария в дерево ---
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

// --- ФУНКЦИЯ УТИЛИТА 4: Удаление комментария из дерева ---
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


const useCommentStore = create((set, get) => ({
    // Состояние
    comments: [],
    loading: false,
    error: null,
    currentArticleSlug: null,

    // 1. Загрузка комментариев для статьи по slug
    fetchComments: async (articleSlug) => {
        set({ loading: true, error: null, currentArticleSlug: articleSlug });
        try {
            const response = await axios.get(`${API_BASE_URL}/${articleSlug}`);
            const threadedComments = buildCommentTree(response.data);
            set({ comments: threadedComments, loading: false });
        } catch (error) {
            console.error("Ошибка при загрузке комментариев:", error);
            set({ error: error.response?.data?.error || 'Не удалось загрузить комментарии.', loading: false });
        }
    },

    // 2. Добавление комментария (БЕЗ сохранения скролла)
    addComment: async (articleSlug, content, parentId) => {
        try {
            const response = await axios.post(API_BASE_URL, {
                articleSlug,
                content,
                parentId
            });

            const newComment = response.data;

            // Просто добавляем комментарий в дерево
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

    // 3. Удаление комментария (БЕЗ сохранения скролла)
    deleteComment: async (commentId, articleSlug) => {
        try {
            await axios.delete(`${API_BASE_URL}/${commentId}`);

            // Просто удаляем комментарий из дерева
            set(state => ({
                comments: removeCommentFromTree(state.comments, commentId)
            }));

        } catch (error) {
            console.error("Ошибка при удалении комментария:", error);
            get().setError(error.response?.data?.error || 'Не удалось удалить комментарий.');
        }
    },

    // 4. Обновление комментария
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

    // 5. Голосование
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

    // Вспомогательные функции
    setError: (message) => set({ error: message }),
    clearError: () => set({ error: null }),

}));

export default useCommentStore;