/**
 * Компонент формы для добавления комментариев и ответов на статьи
 * 
 * @component
 * @param {Object} props - Свойства компонента
 * @param {string} props.articleSlug - Уникальный идентификатор статьи
 * @param {string|null} props.parentId - ID родительского комментария (null для корневых комментариев)
 * @param {Function} props.onSubmitted - Колбэк, вызываемый после успешной отправки комментария
 * 
 * @example
 * // Форма для корневого комментария
 * <CommentForm 
 *   articleSlug="my-article-slug" 
 *   onSubmitted={() => console.log('Comment added')} 
 * />
 * 
 * // Форма для ответа на комментарий
 * <CommentForm 
 *   articleSlug="my-article-slug"
 *   parentId="123"
 *   onSubmitted={() => setShowReplyForm(false)}
 * />
 */
import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useCommentStore from '../../store/useCommentStore';
import { useToast } from '../Toast/ToastContainer';
import styles from './CommentForm.module.scss';

const CommentForm = ({ articleSlug, parentId = null, onSubmitted }) => {
    // --- СТОРЫ И ХУКИ ---
    
    // Получаем состояние аутентификации и данные пользователя
    const { isAuthenticated, user } = useAuthStore();
    
    // Функция для добавления комментария из стора
    const { addComment } = useCommentStore();
    
    // Система уведомлений (тосты)
    const toast = useToast();
    
    // --- СОСТОЯНИЯ КОМПОНЕНТА ---
    
    // Содержимое текстового поля комментария
    const [content, setContent] = useState('');
    
    // Флаг процесса отправки (для блокировки UI)
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- ПРОВЕРКА АУТЕНТИФИКАЦИИ ---
    
    // Если пользователь не авторизован, показываем сообщение вместо формы
    if (!isAuthenticated) {
        return (
            <p className={styles.login_prompt}>
                Пожалуйста, войдите в систему, чтобы оставить комментарий.
            </p>
        );
    }
    
    // --- ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ ---
    
    /**
     * Обрабатывает отправку формы комментария
     * 
     * @param {Event} e - Событие формы
     * @returns {Promise<void>}
     * 
     * @throws {Error} При ошибке сети или сервера
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Валидация: пустой комментарий или уже идет отправка
        if (!content.trim() || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            // ВНИМАНИЕ: fetchUser() был удален из кода
            // Теперь полагаемся на то, что axios interceptor (axiosConfig.js) 
            // автоматически обработает 401 ошибку и обновит токен при необходимости
            
            // Вызываем действие стора для добавления комментария
            const newComment = await addComment(articleSlug, content, parentId);
            
            if (newComment) {
                // УСПЕХ:
                // 1. Очищаем текстовое поле
                setContent('');
                
                // 2. Показываем уведомление об успехе
                toast.success('Комментарий успешно добавлен!');
                
                // 3. Вызываем колбэк (например, для закрытия формы ответа)
                if (onSubmitted) {
                    onSubmitted();
                }
            } else {
                // ОШИБКА: addComment вернул null
                // Ошибка уже обработана в store, но показываем общее сообщение
                toast.error('Не удалось добавить комментарий. Попробуйте снова.');
            }
        } catch (error) {
            console.error('Ошибка при отправке комментария:', error);
            
            // Обработка специфических ошибок
            if (error.response?.status === 401) {
                // 401 - неавторизован (скорее всего истекший токен)
                toast.error('Ваша сессия истекла. Пожалуйста, войдите снова.');
            } else {
                // Любая другая ошибка
                toast.error('Произошла ошибка. Попробуйте снова.');
            }
        } finally {
            // Снимаем блокировку UI независимо от результата
            setIsSubmitting(false);
        }
    };
    
    // --- РЕНДЕРИНГ ФОРМЫ ---
    
    return (
        <form onSubmit={handleSubmit} className={styles.comment_form}>
            {/* Шапка с информацией о пользователе */}
            <div className={styles.header}>
                {user?.avatarUrl && (
                    <img
                        src={`http://localhost:5000${user.avatarUrl}`}
                        alt={user?.name}
                        className={styles.avatar}
                    />
                )}
                <p>
                    Комментировать как: {user?.name + ' '}
                    ({user?.isAdmin ? 'Администратор' : 'Пользователь'})
                </p>
            </div>
            
            {/* Текстовое поле для комментария */}
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={parentId ? 'Ваш ответ...' : 'Ваш комментарий...'}
                rows={parentId ? 2 : 4}  // Меньше строк для ответов
                disabled={isSubmitting}   // Блокируем при отправке
            />
            
            {/* Кнопка отправки */}
            <button 
                type="submit" 
                disabled={!content.trim() || isSubmitting}
            >
                {isSubmitting 
                    ? 'Отправка...' 
                    : parentId 
                        ? 'Ответить' 
                        : 'Отправить комментарий'
                }
            </button>
        </form>
    );
};

export default CommentForm;
