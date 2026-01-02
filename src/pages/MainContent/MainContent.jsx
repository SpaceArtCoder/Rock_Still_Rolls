import NewsCarousel from '../../components/NewsCarousel/NewsCarousel.jsx';
import LatestNews from '../../components/LatestNews/LatestNews.jsx';
import ContactUs from '../../components/UI/ContactUs/ContactUs.jsx';
import styles from './MainContent.module.scss';

/**
 * Компонент главной страницы контента
 * Содержит основные секции: карусель новостей, последние новости и форму обратной связи
 */
function MainContent() {
    return (
        <section className={styles.main_content_page}>
            {/* Секция с каруселью новостей (главные новости) */}
            <NewsCarousel />
            
            {/* Секция с последними новостями */}
            <LatestNews />
            
            {/* Секция формы обратной связи */}
            <ContactUs />
        </section>
    );
}

export default MainContent;
