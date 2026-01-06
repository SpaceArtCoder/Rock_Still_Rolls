import { useEffect } from 'react';
import useCommentStore from '../../store/useCommentStore';
import CommentList from '../CommentList/CommentList';
import CommentForm from '../CommentForm/CommentForm';
import styles from './CommentSection.module.scss';

const CommentSection = ({ articleSlug }) => {
    const { comments, loading, error, fetchComments } = useCommentStore();

    useEffect(() => {
        if (articleSlug) {
            fetchComments(articleSlug);
        }
    }, [articleSlug, fetchComments]);

    return (
        <div className={styles.comment_section}>
            <h2>Комментарии ({comments.length})</h2>

            <CommentForm articleSlug={articleSlug} />

            {loading && <p>Загрузка комментариев...</p>}
            {error && <p className={styles.error}>Ошибка: {error}</p>}

            {/* Список комментариев */}
            <CommentList comments={comments} articleSlug={articleSlug} />
        </div>
    );
};

export default CommentSection;