import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { parseVideoShortcodes } from '../../../utils/videoParser'; // НОВЫЙ ИМПОРТ
import CommentSection from '../../CommentSection/CommentSection';
import useAuthStore from '../../../store/useAuthStore'; // НОВЫЙ ИМПОРТ
import styles from './ArticlePage.module.scss';

const ArticlePage = () => {
    const { slug } = useParams(); 
    const { isLoading: isAuthLoading } = useAuthStore(); // ПОЛУЧАЕМ ФЛАГ ЗАГРУЗКИ
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const decodedSlug = decodeURIComponent(slug);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const response = await fetch(`https://uncramped-robbin-patrimonial.ngrok-free.dev/api/articles/${decodedSlug}`);
                
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

    if (loading || isAuthLoading) return <div className={styles.loading}>Загрузка статьи...</div>;
    if (error) return <div className={styles.error}>Ошибка: {error}</div>;
    if (!article) return <div className={styles.notFound}>Статья не найдена.</div>;

    const dateTimeOptions = { 
        year: 'numeric', 
        month: 'numeric', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
    };

    // НОВОЕ: Обрабатываем шорткоды видео перед рендерингом
    const processedContent = parseVideoShortcodes(article.content);

    return (
        <div className={styles.article_block}>
            <h1>{article.title}</h1>
            
            {article.image && (
                <img 
                    src={`https://uncramped-robbin-patrimonial.ngrok-free.dev${article.image}`} 
                    alt={article.title} 
                    className={styles.featuredImage}
                />
            )}
            
            <p className={styles.pub_date}>
                Опубликовано: {article.createdAt
                ? new Date(article.createdAt).toLocaleString(undefined, dateTimeOptions)
                 : 'Дата не указана'} 
            </p>
            
            <div className={`${styles.article_content} article-content`}>
                <ReactMarkdown
                    children={processedContent}
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                />
            </div>

            {/* НОВАЯ СЕКЦИЯ КОММЕНТАРИЕВ */}
            <CommentSection articleSlug={slug} />
        </div>
    );
};

export default ArticlePage;