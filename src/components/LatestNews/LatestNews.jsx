import NewsFeed from '../UI/FeedNews/NewsFeed';
import styles from './LatestNews.module.scss';

/**
 * Компонент "Последние новости".
 * Отображает ленту новостей по заданной категории с использованием шаблона стилей.
 */
function LatestNews() {
    // Объект с классами CSS для кастомизации компонента NewsFeed
    const newsFeedTemplate = {
        news_feed_container: 'news_feed_template',
        article_card: 'article_card_template',
        read_more: 'read_more_template'
    };
    
    return (
        <section className={styles.latest_news_container}>
            {/* Компонент ленты новостей с фильтрацией по категории */}
            <NewsFeed 
                category={`(рок%20OR%20"рок-звезд"%20OR%20концерты%20OR%20"рок-концерты")`} 
                templateClassName={newsFeedTemplate} 
                newsCount={9}
            />
        </section>
    );
}

export default LatestNews;
