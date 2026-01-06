import NewsFeed from '../UI/FeedNews/NewsFeed.jsx';
import styles from './NewsCarousel.module.scss';

function NewsCarousel() {
    return (
        <section className={styles.news_carousel_container}>
            <NewsFeed newsCount={3}/>
        </section>
    )
}

export default NewsCarousel;