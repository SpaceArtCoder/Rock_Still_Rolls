import NewsCarousel from '../../components/NewsCarousel/NewsCarousel.jsx';
import LatestNews from '../../components/LatestNews/LatestNews.jsx';
import ContactUs from '../../components/UI/ContactUs/ContactUs.jsx';
import styles from './MainContent.module.scss';

function MainContent() {
    return (
        <section className={styles.main_content_page}>
            <NewsCarousel />
            <LatestNews />
            <ContactUs />
        </section>
    )
}

export default MainContent;