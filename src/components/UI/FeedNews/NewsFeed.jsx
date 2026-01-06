import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './NewsFeed.module.scss';

const NewsFeed = ({newsCount = null, templateClassName = null}) => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        async function fetchArticles() {
            try {
                const countParam = newsCount ? `&limit=${newsCount}` : '';
                // Запрос к Node.js бэкенду, который слушает порт 5000
                const response = await fetch(`https://uncramped-robbin-patrimonial.ngrok-free.dev/api/articles?category=Новости${countParam}`);
                
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


    useEffect(() => {
        if (articles.length === 0) return;
        
        const intervalId = setInterval(() => {
            setActiveIndex(prevIndex => (prevIndex + 1) % articles.length);
        }, 3000);

        return () => clearInterval(intervalId);
    }, [articles.length]);

    const currentArticle = articles[activeIndex];

    // ... остальной код рендеринга такой же, как и раньше
    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>Ошибка: {error.message}</div>;  
    }

    if (!currentArticle) {
        return <div>Нет доступных новостей.</div>;
    }
 
    return (
        <div className={`${templateClassName ? templateClassName.news_feed_container : styles.news_feed_container}`}>
            {articles.map((article, index) => (
                <div key={index} className={`${templateClassName ? templateClassName.article_card : `${styles.article_card} ${index === activeIndex ? styles.active : ''}`}`}>
                    {/* <a href={`${templateClassName ? article.slug : currentArticle.url}`} target="_blank" rel="noopener noreferrer"> */}
                    <Link to={`/news/${article.slug}`}>
                        <img src={`${templateClassName ? article.image : currentArticle.image}`} alt={`${templateClassName ? article.title : currentArticle.title}`}/>
                        <h2>{`${templateClassName ? article.title : currentArticle.title}`}</h2>
                    </Link>
                    {/* </a> */}
                    <p className={styles.scrolling_element}>{`${templateClassName ? article.excerpt : currentArticle.excerpt}`}</p>
                    {/* <a className={`${templateClassName ? templateClassName.read_more : styles.read_more}`} href={`${templateClassName ? article.url : currentArticle.url}`} target="_blank" rel="noopener noreferrer"> */}
                    <Link to={`/news/${article.slug}`} className={`${templateClassName ? templateClassName.read_more : styles.read_more}`}>
                        Читать далее
                    </Link>
                    {/* </a> */}
                </div>
            ))}
                
        </div>
    );
};

export default NewsFeed;