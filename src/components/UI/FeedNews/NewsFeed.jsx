import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsFeed.module.scss';

/**
 * Компонент ленты новостей с автоматической ротацией статей.
 * Поддерживает кастомизацию через CSS-классы и ограничение количества отображаемых новостей.
 * @param {Object} props - Свойства компонента
 * @param {number} props.newsCount - Максимальное количество отображаемых новостей
 * @param {Object} props.templateClassName - Объект с CSS-классами для кастомизации
 */
const NewsFeed = ({ newsCount = null, templateClassName = null }) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);

    /**
     * Эффект для загрузки статей из API.
     */
    useEffect(() => {
        async function fetchArticles() {
            try {
                const countParam = newsCount ? `&limit=${newsCount}` : '';
                const response = await fetch(`http://localhost:5000/api/articles?category=Новости${countParam}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setArticles(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchArticles();
    }, []);

    /**
     * Эффект для автоматической ротации активной статьи каждые 3 секунды.
     */
    useEffect(() => {
        if (articles.length === 0) return;
        
        const intervalId = setInterval(() => {
            setActiveIndex(prevIndex => (prevIndex + 1) % articles.length);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [articles.length]);

    const currentArticle = articles[activeIndex];

    // Индикатор загрузки
    if (loading) {
        return <div>Загрузка...</div>;
    }

    // Обработка ошибки загрузки
    if (error) {
        return <div>Ошибка: {error.message}</div>;  
    }

    // Сообщение об отсутствии новостей
    if (!currentArticle) {
        return <div>Нет доступных новостей.</div>;
    }
 
    return (
        <div className={`${templateClassName ? templateClassName.news_feed_container : styles.news_feed_container}`}>
            {/* Отображение всех загруженных статей */}
            {articles.map((article, index) => (
                <div key={index} className={`${templateClassName ? templateClassName.article_card : `${styles.article_card} ${index === activeIndex ? styles.active : ''}`}`}>
                    {/* Ссылка на статью с изображением и заголовком */}
                    <Link to={`/news/${article.slug}`}>
                        <img src={`${templateClassName ? article.image : currentArticle.image}`} alt={`${templateClassName ? article.title : currentArticle.title}`}/>
                        <h2>{`${templateClassName ? article.title : currentArticle.title}`}</h2>
                    </Link>
                    
                    {/* Краткое описание статьи с анимацией */}
                    <p className={styles.scrolling_element}>{`${templateClassName ? article.excerpt : currentArticle.excerpt}`}</p>
                    
                    {/* Ссылка "Читать далее" */}
                    <Link to={`/news/${article.slug}`} className={`${templateClassName ? templateClassName.read_more : styles.read_more}`}>
                        Читать далее
                    </Link>
                </div>
            ))}
        </div>
    );
};

export default NewsFeed;
