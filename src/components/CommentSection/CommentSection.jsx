import { useEffect } from 'react';
import useCommentStore from '../../store/useCommentStore';
import CommentList from '../CommentList/CommentList';
import CommentForm from '../CommentForm/CommentForm';
import styles from './CommentSection.module.scss';

/**
 * Компонент секции комментариев к статье.
 * Отображает форму добавления комментария и список существующих комментариев.
 */
const CommentSection = ({ articleSlug }) => {
    // Получение состояния комментариев из хранилища
    const { comments, loading, error, fetchComments } = useCommentStore();

    /**
     * Эффект для загрузки комментариев при монтировании компонента
     * или изменении идентификатора статьи.
     */
    useEffect(() => {
        if (articleSlug) {
            fetchComments(articleSlug);
        }
    }, [articleSlug, fetchComments]);

    return (
        <div className={styles.comment_section}>
            {/* Заголовок секции с количеством комментариев */}
            <h2>Комментарии ({comments.length})</h2>

            {/* Форма для добавления нового комментария */}
            <CommentForm articleSlug={articleSlug} />

            {/* Индикатор загрузки */}
            {loading && <p>Загрузка комментариев...</p>}
            
            {/* Отображение ошибки загрузки */}
            {error && <p className={styles.error}>Ошибка: {error}</p>}

            {/* Список комментариев */}
            <CommentList comments={comments} articleSlug={articleSlug} />
        </div>
    );
};

export default CommentSection;
