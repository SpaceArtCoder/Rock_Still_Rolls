import NewsFeed from '../UI/FeedNews/NewsFeed';
import styles from './LatestNews.module.scss';

function LatestNews() {
    const newsFeedTemplate = {
        news_feed_container: 'news_feed_template',
        article_card: 'article_card_template',
        read_more: 'read_more_template'
    }
    return (
        <section className={styles.latest_news_container}>
            <NewsFeed category={`(рок%20OR%20"рок-звезд"%20OR%20концерты%20OR%20"рок-концерты")`} templateClassName={newsFeedTemplate} newsCount={9}/>
        </section>
    )
}

export default LatestNews;