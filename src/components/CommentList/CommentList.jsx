import CommentItem from '../CommentItem/CommentItem'; // Создадим ниже
import styles from './CommentList.module.scss'; // Создайте SCSS файл

const CommentList = ({ comments, articleSlug }) => {
    if (!comments || comments.length === 0) {
        return <p className={styles.no_comments}>Пока нет комментариев. Будьте первыми!</p>;
    }

    return (
        <div className={styles.comment_list}>
            {comments.map(comment => (
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