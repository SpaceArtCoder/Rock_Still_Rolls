import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { parseVideoShortcodes } from '../../../utils/videoParser';
import CommentSection from '../../CommentSection/CommentSection';
import useAuthStore from '../../../store/useAuthStore';
import styles from './ArticlePage.module.scss';

/**
 * Компонент страницы статьи.
 * Отображает полное содержание статьи с поддержкой Markdown и шорткодов видео.
 */
const ArticlePage = () => {
    const { slug } = useParams(); 
    const { isLoading: isAuthLoading } = useAuthStore();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const decodedSlug = decodeURIComponent(slug);

    /**
     * Эффект для загрузки данных статьи при монтировании компонента.
     */
    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/articles/${decodedSlug}`);
                
                if (!response.ok) {
                    throw new Error('Article not found or server error.');
                }
                
                const data = await response.json();
                setArticle(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchArticle();
    }, [decodedSlug]);

    // Отображение индикатора загрузки
    if (loading || isAuthLoading) return <div className={styles.loading}>Загрузка статьи...</div>;
    
    // Отображение ошибки загрузки
    if (error) return <div className={styles.error}>Ошибка: {error}</div>;
    
    // Отображение сообщения об отсутствии статьи
    if (!article) return <div className={styles.notFound}>Статья не найдена.</div>;

    // Форматирование даты и времени публикации
    const dateTimeOptions = { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
    };

    // Обработка шорткодов видео в содержимом статьи
    const processedContent = parseVideoShortcodes(article.content);

    return (
        <div className={styles.article_block}>
            {/* Заголовок статьи */}
            <h1>{article.title}</h1>
            
            {/* Главное изображение статьи */}
            {article.image && (
                <img 
                    src={`http://localhost:5000${article.image}`} 
                    alt={article.title} 
                    className={styles.featuredImage}
                />
            )}
            
            {/* Дата и время публикации */}
            <p className={styles.pub_date}>
                Опубликовано: {article.createdAt
                ? new Date(article.createdAt).toLocaleString(undefined, dateTimeOptions)
                 : 'Дата не указана'} 
            </p>
            
            {/* Содержимое статьи с поддержкой Markdown */}
            <div className={`${styles.article_content} article-content`}>
                <ReactMarkdown
                    children={processedContent}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                />
            </div>

            {/* Секция комментариев */}
            <CommentSection articleSlug={slug} />
        </div>
    );
};

export default ArticlePage;
