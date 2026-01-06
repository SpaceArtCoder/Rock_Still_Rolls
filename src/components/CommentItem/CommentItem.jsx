import { useState } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useCommentStore from '../../store/useCommentStore';
import CommentForm from '../CommentForm/CommentForm';
import styles from './CommentItem.module.scss';

const CommentItem = ({ comment, articleSlug }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { deleteComment, voteComment, updateComment } = useCommentStore();
    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const isAuthor = user?.id === comment.authorId;
    const canDelete = isAuthor || user?.isAdmin;
    const canEdit = isAuthor;

    const handleDelete = () => {
        if (window.confirm('Вы уверены, что хотите удалить этот комментарий?')) {
            deleteComment(comment.id, articleSlug);
        }
    };

    const handleVote = (type) => {
        if (isAuthenticated) {
            voteComment(comment.id, type);
        } else {
            alert('Для голосования необходимо войти.');
        }
    };

    // --- НОВАЯ/ОБНОВЛЕННАЯ ЛОГИКА РЕДАКТИРОВАНИЯ ---
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const trimmedContent = editContent.trim();
        
        if (!trimmedContent || trimmedContent === comment.content.trim()) {
            // Ничего не изменилось или пусто
            setIsEditing(false);
            setEditContent(comment.content); // Возвращаем оригинальное
            return;
        }

        // Вызываем функцию обновления из стора
        const updated = await updateComment(comment.id, trimmedContent);

        if (updated) {
            // Если успешно, закрываем форму редактирования
            setIsEditing(false);
            // Если запрос не сработал (например, ошибка сети), форма остается открытой
        } else {
             // Можно добавить уведомление об ошибке
             alert('Не удалось сохранить изменения.');
        }
    };
    // ----------------------------------------------

    return (
        <div className={styles.comment_item}>
            <div className={styles.header}>
                {comment.author.avatarUrl && (
                    <img 
                        src={`https://uncramped-robbin-patrimonial.ngrok-free.dev${comment.author.avatarUrl}`} 
                        alt={comment.author.name} 
                        className={styles.avatar} 
                    />
                )}
                <div className={styles.info}>
                    <span className={styles.name}>{comment.author.name}</span>
                    {comment.author.isAdmin && <span className={styles.admin_badge}>Админ</span>}
                    <span className={styles.date}>
                        {new Date(comment.createdAt).toLocaleString()}
                    </span>
                </div>
            </div>

            <div className={styles.body}>
                {isEditing ? (
                    <form onSubmit={handleEditSubmit}>
                        <textarea 
                            value={editContent} 
                            onChange={(e) => setEditContent(e.target.value)} 
                            rows={3} 
                            // Добавим простую валидацию для кнопки
                            className={styles.edit_textarea}
                        />
                        <div className={styles.edit_controls}>
                            <button type="submit" disabled={!editContent.trim() || editContent.trim() === comment.content.trim()}>Сохранить</button>
                            <button type="button" onClick={() => {
                                setIsEditing(false);
                                setEditContent(comment.content); // Сброс к исходному содержанию
                            }}>Отмена</button>
                        </div>

                    </form>
                ) : (
                    <p>{comment.content}</p>
                )}
            </div>

            <div className={styles.actions}>
                {/* Лайки / Дизлайки */}
                <button onClick={() => handleVote('LIKE')} className={styles.like_btn}>
                    👍 {comment.likes}
                </button>
                <button onClick={() => handleVote('DISLIKE')} className={styles.dislike_btn}>
                    👎 {comment.dislikes}
                </button>
                
                {/* Ответ */}
                {isAuthenticated && (
                    <button onClick={() => setIsReplying(!isReplying)} className={styles.reply_btn}>
                        {isReplying ? 'Отменить' : 'Ответить'}
                    </button>
                )}

                {/* Редактировать / Удалить */}
                {/* Кнопка Редактировать: теперь открывает форму, которая отправляет PUT-запрос */}
                {canEdit && !isEditing && ( // Показываем кнопку, только если не в режиме редактирования
                    <button onClick={() => setIsEditing(true)} className={styles.edit_btn}>
                        Редактировать
                    </button>
                )}
                {canDelete && (
                    <button onClick={handleDelete} className={styles.delete_btn}>
                        Удалить
                    </button>
                )}
            </div>

            {/* Форма ответа */}
            {isReplying && (
                <div className={styles.reply_form_container}>
                    <CommentForm 
                        articleSlug={articleSlug} 
                        parentId={comment.id} 
                        onSubmitted={() => setIsReplying(false)} 
                    />
                </div>
            )}

            {/* Вложенные ответы */}
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