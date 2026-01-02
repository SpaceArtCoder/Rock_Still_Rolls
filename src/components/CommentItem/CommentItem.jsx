/**
 * Компонент отображения отдельного комментария с поддержкой:
 * - Просмотра информации об авторе и содержимого
 * - Голосования (лайки/дизлайки)
 * - Ответов на комментарии
 * - Редактирования и удаления (для автора/админа)
 * - Отображения вложенных ответов
 * 
 * @component
 * @param {Object} props - Свойства компонента
 * @param {Object} props.comment - Объект комментария
 * @param {string} props.comment.id - Уникальный идентификатор комментария
 * @param {string} props.comment.content - Текст комментария
 * @param {string} props.comment.authorId - ID автора комментария
 * @param {Object} props.comment.author - Информация об авторе
 * @param {string} props.comment.author.name - Имя автора
 * @param {string} props.comment.author.avatarUrl - URL аватара автора
 * @param {boolean} props.comment.author.isAdmin - Флаг администратора
 * @param {string} props.comment.createdAt - Дата создания комментария
 * @param {number} props.comment.likes - Количество лайков
 * @param {number} props.comment.dislikes - Количество дизлайков
 * @param {Array} props.comment.replies - Массив ответов на комментарий
 * @param {string} props.articleSlug - Уникальный идентификатор статьи
 * 
 * @example
 * <CommentItem 
 *   comment={commentData}
 *   articleSlug="article-123"
 * />
 */

import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useCommentStore from '../../store/useCommentStore';
import CommentForm from '../CommentForm/CommentForm';
import styles from './CommentItem.module.scss';

const CommentItem = ({ comment, articleSlug }) => {
    // --- СОСТОЯНИЯ АУТЕНТИФИКАЦИИ И СТОРЫ ---
    
    // Получаем данные текущего пользователя и статус аутентификации
    const { user, isAuthenticated } = useAuthStore();
    
    // Функции для работы с комментариями из глобального стора
    const { deleteComment, voteComment, updateComment } = useCommentStore();
    
    // --- ЛОКАЛЬНЫЕ СОСТОЯНИЯ КОМПОНЕНТА ---
    
    // Флаг отображения формы ответа
    const [isReplying, setIsReplying] = useState(false);
    
    // Флаг режима редактирования комментария
    const [isEditing, setIsEditing] = useState(false);
    
    // Содержимое редактируемого комментария (инициализируется оригинальным текстом)
    const [editContent, setEditContent] = useState(comment.content);
    
    // --- ПРАВА ДОСТУПА ---
    
    // Проверяем, является ли текущий пользователь автором комментария
    const isAuthor = user?.id === comment.authorId;
    
    // Право на удаление: автор или администратор
    const canDelete = isAuthor || user?.isAdmin;
    
    // Право на редактирование: только автор
    const canEdit = isAuthor;
    
    // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---
    
    /**
     * Обрабатывает удаление комментария
     * Показывает подтверждающий диалог перед удалением
     */
    const handleDelete = () => {
        if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
            deleteComment(comment.id, articleSlug);
        }
    };
    
    /**
     * Обрабатывает голосование (лайк/дизлайк)
     * 
     * @param {string} type - Тип голоса: 'LIKE' или 'DISLIKE'
     */
    const handleVote = (type) => {
        if (isAuthenticated) {
            voteComment(comment.id, type);
        } else {
            alert('Для голосования необходимо войти.');
        }
    };
    
    // --- ОБРАБОТКА РЕДАКТИРОВАНИЯ КОММЕНТАРИЯ ---
    
    /**
     * Обрабатывает отправку формы редактирования комментария
     * 
     * @param {Event} e - Событие формы
     * @returns {Promise<void>}
     */
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        // Убираем лишние пробелы
        const trimmedContent = editContent.trim();
        
        // Проверяем, что текст изменился и не пустой
        if (!trimmedContent || trimmedContent === comment.content.trim()) {
            // Ничего не изменилось или пусто - отменяем редактирование
            setIsEditing(false);
            setEditContent(comment.content); // Восстанавливаем оригинальный текст
            return;
        }

        // Вызываем функцию обновления из стора
        const updated = await updateComment(comment.id, trimmedContent);

        if (updated) {
            // Успешное обновление - закрываем форму редактирования
            setIsEditing(false);
        } else {
            // Ошибка обновления - показываем сообщение
            alert('Не удалось сохранить изменения.');
        }
    };
    
    // --- РЕНДЕРИНГ КОМПОНЕНТА ---
    
    return (
        <div className={styles.comment_item}>
            {/* Шапка комментария с информацией об авторе */}
            <div className={styles.header}>
                {comment.author.avatarUrl && (
                    <img 
                        src={`http://localhost:5000${comment.author.avatarUrl}`} 
                        alt={comment.author.name} 
                        className={styles.avatar} 
                    />
                )}
                <div className={styles.info}>
                    {/* Имя автора */}
                    <span className={styles.name}>{comment.author.name}</span>
                    
                    {/* Бейдж администратора (если есть) */}
                    {comment.author.isAdmin && (
                        <span className={styles.admin_badge}>Админ</span>
                    )}
                    
                    {/* Дата создания комментария */}
                    <span className={styles.date}>
                        {new Date(comment.createdAt).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Тело комментария */}
            <div className={styles.body}>
                {isEditing ? (
                    // Форма редактирования (режим редактирования)
                    <form onSubmit={handleEditSubmit}>
                        <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            rows={3} 
                            className={styles.edit_textarea}
                        />
                        <div className={styles.edit_controls}>
                            {/* Кнопка сохранения (активна только при изменениях) */}
                            <button 
                                type="submit" 
                                disabled={!editContent.trim() || editContent.trim() === comment.content.trim()}
                            >
                                Сохранить
                            </button>
                            
                            {/* Кнопка отмены редактирования */}
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content); // Сбрасываем к оригиналу
                                }}
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                ) : (
                    // Отображение текста комментария (обычный режим)
                    <p>{comment.content}</p>
                )}
            </div>

            {/* Панель действий с комментарием */}
            <div className={styles.actions}>
                {/* Кнопка лайка */}
                <button 
                    onClick={() => handleVote('LIKE')} 
                    className={styles.like_btn}
                >
                    👍 {comment.likes}
                </button>
                
                {/* Кнопка дизлайка */}
                <button 
                    onClick={() => handleVote('DISLIKE')} 
                    className={styles.dislike_btn}
                >
                    👎 {comment.dislikes}
                </button>
                
                {/* Кнопка ответа (только для авторизованных) */}
                {isAuthenticated && (
                    <button 
                        onClick={() => setIsReplying(!isReplying)} 
                        className={styles.reply_btn}
                    >
                        {isReplying ? 'Отменить' : 'Ответить'}
                    </button>
                )}

                {/* Кнопка редактирования (только для автора, не в режиме редактирования) */}
                {canEdit && !isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)} 
                        className={styles.edit_btn}
                    >
                        Редактировать
                    </button>
                )}
                
                {/* Кнопка удаления (для автора или админа) */}
                {canDelete && (
                    <button 
                        onClick={handleDelete} 
                        className={styles.delete_btn}
                    >
                        Удалить
                    </button>
                )}
            </div>

            {/* Форма для ответа на комментарий */}
            {isReplying && (
                <div className={styles.reply_form_container}>
                    <CommentForm 
                        articleSlug={articleSlug} 
                        parentId={comment.id} 
                        onSubmitted={() => setIsReplying(false)} 
                    />
                </div>
            )}

            {/* Вложенные ответы (рекурсивный рендеринг) */}
            {comment.replies && comment.replies.length > 0 && (
                <div className={styles.replies}>
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            articleSlug={articleSlug} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
