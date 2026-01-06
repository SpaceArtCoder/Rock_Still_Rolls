// src/components/CommentForm/CommentForm.jsx (ИСПРАВЛЕНО - БЕЗ ПЕРЕЗАГРУЗКИ)
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useCommentStore from '../../store/useCommentStore';
import { useToast } from '../Toast/ToastContainer';
import styles from './CommentForm.module.scss';

const CommentForm = ({ articleSlug, parentId = null, onSubmitted }) => {
    const { isAuthenticated, user } = useAuthStore(); // УБРАЛИ fetchUser из деструктуризации
    const { addComment } = useCommentStore();
    const toast = useToast();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isAuthenticated) {
        return (
            <p className={styles.login_prompt}>
                Пожалуйста, войдите в систему, чтобы оставить комментарий.
            </p>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // ИСПРАВЛЕНО: Убрали await fetchUser()
            // Полагаемся на текущее состояние isAuthenticated и user
            // Axios interceptor (axiosConfig.js) автоматически обработает 401 ошибку

            const newComment = await addComment(articleSlug, content, parentId);

            if (newComment) {
                // Успех
                setContent('');
                toast.success('Комментарий успешно добавлен!');

                // Закрываем форму ответа, если это ответ
                if (onSubmitted) {
                    onSubmitted();
                }
            } else {
                // addComment вернул null - ошибка уже обработана в store
                toast.error('Не удалось добавить комментарий. Попробуйте снова.');
            }
        } catch (error) {
            console.error('Ошибка при отправке комментария:', error);

            // Проверяем, была ли это ошибка авторизации
            if (error.response?.status === 401) {
                toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
            } else {
                toast.error('Произошла ошибка. Попробуйте снова.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className={styles.comment_form}>
            <div className={styles.header}>
                {user?.avatarUrl && (
                    <img
                        src={`https://uncramped-robbin-patrimonial.ngrok-free.dev${user.avatarUrl}`}
                        alt={user?.name}
                        className={styles.avatar}
                    />
                )}
                <p>
                    Комментировать как: {user?.name + ' '}
                    ({user?.isAdmin ? 'Администратор' : 'Пользователь'})
                </p>
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentId ? 'Ваш ответ...' : 'Ваш комментарий...'}
                rows={parentId ? 2 : 4}
                disabled={isSubmitting}
            />
            <button type="submit" disabled={!content.trim() || isSubmitting}>
                {isSubmitting ? 'Отправка...' : parentId ? 'Ответить' : 'Отправить комментарий'}
            </button>
        </form>
    );
};

export default CommentForm;