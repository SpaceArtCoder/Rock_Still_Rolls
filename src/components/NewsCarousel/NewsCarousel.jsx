import NewsFeed from '../UI/FeedNews/NewsFeed.jsx';
import styles from './NewsCarousel.module.scss';

/**
 * Компонент карусели новостей.
 * Отображает ленту из 3 последних новостей в формате карусели.
 */
function NewsCarousel() {
    return (
        <section className={styles.news_carousel_container}>
            {/* Компонент ленты новостей с ограничением в 3 элемента */}
            <NewsFeed newsCount={3}/>
        </section>
    );
}

export default NewsCarousel;
