import NewsCarousel from '../../components/NewsCarousel/NewsCarousel.jsx';
import LatestNews from '../../components/LatestNews/LatestNews.jsx';
import ContactUs from '../../components/UI/ContactUs/ContactUs.jsx';
import styles from './MainContent.module.scss';

/**
 * Компонент MainContent - контейнер для основного содержимого главной страницы
 * Структура главной страницы:
 * 1. NewsCarousel - карусель с главными новостями/событиями
 * 2. LatestNews - блок последних новостей
 * 3. ContactUs - секция для связи с пользователями
 * 
 * @returns {JSX.Element} Основной контент главной страницы
 */
function MainContent() {
    return (
        // Основной контейнер страницы с применением стилей
        <section className={styles.main_content_page}>
            {/* Компонент карусели для отображения главных новостей/событий */}
            <NewsCarousel />
            
            {/* Компонент с последними новостями */}
            <LatestNews />
            
            {/* Компонент секции "Свяжитесь с нами" */}
            <ContactUs />
        </section>
    );
}

export default MainContent;
