/**
 * Компонент для отображения списка комментариев к статье.
 * Отображает либо сообщение об отсутствии комментариев, 
 * либо список комментариев с поддержкой вложенной структуры.
 * 
 * @component
 * @param {Object} props - Свойства компонента
 * @param {Array} props.comments - Массив комментариев для отображения
 * @param {Object[]} props.comments - Каждый элемент массива комментариев
 * @param {string} props.comments[].id - Уникальный идентификатор комментария
 * @param {string} props.comments[].content - Текст комментария
 * @param {string} props.comments[].authorId - ID автора комментария
 * @param {Object} props.comments[].author - Информация об авторе
 * @param {string} props.comments[].author.name - Имя автора
 * @param {string} props.comments[].author.avatarUrl - URL аватара
 * @param {boolean} props.comments[].author.isAdmin - Флаг администратора
 * @param {string} props.comments[].createdAt - Дата создания
 * @param {number} props.comments[].likes - Количество лайков
 * @param {number} props.comments[].dislikes - Количество дизлайков
 * @param {Array} props.comments[].replies - Вложенные ответы (рекурсивная структура)
 * @param {string} props.articleSlug - Уникальный идентификатор статьи для API-запросов
 * 
 * @example
 * // Пример использования:
 * <CommentList 
 *   comments={commentsData}
 *   articleSlug="how-to-learn-react"
 * />
 * 
 * @returns {JSX.Element} Список комментариев или сообщение об их отсутствии
 */

import CommentItem from '../CommentItem/CommentItem';
import styles from './CommentList.module.scss';

const CommentList = ({ comments, articleSlug }) => {
    // --- ПРОВЕРКА НА НАЛИЧИЕ КОММЕНТАРИЕВ ---
    
    // Если комментариев нет или массив пуст, показываем сообщение
    if (!comments || comments.length === 0) {
        return (
            <p className={styles.no_comments}>
                Пока нет комментариев. Будьте первыми!
            </p>
        );
    }

    // --- РЕНДЕРИНГ СПИСКА КОММЕНТАРИЕВ ---
    
    return (
        <div className={styles.comment_list}>
            {comments.map(comment => (
                /**
                 * Рекурсивно рендерим каждый комментарий.
                 * CommentItem сам обработает вложенные ответы (replies).
                 * 
                 * @key {string} comment.id - Используем ID комментария как ключ
                 */
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    articleSlug={articleSlug} 
                />
            ))}
        </div>
    );
};

export default CommentList;
