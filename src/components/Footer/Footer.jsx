import { Link } from 'react-router-dom';
import Categories from '../UI/Categories/Categories';
import CurrentYear from '../CurrentYear/CurrentYear';
import styles from './Footer.module.scss';

/**
 * Компонент подвала (футера) сайта.
 * Отображает категории, ссылку на политику конфиденциальности и копирайт с текущим годом.
 */
function Footer() {
    return (
        <footer className={styles.footer}>
            {/* Компонент категорий с дополнительными стилями для футера */}
            <Categories links_direction={"show_footer_links"}/>
            
            {/* Ссылка на страницу политики конфиденциальности */}
            <Link className={styles.privacy_policy} to="/privacy-policy">
                Политика конфиденциальности
            </Link>
            
            {/* Компонент с текущим годом для копирайта */}
            <CurrentYear />
        </footer>
    );
}

export default Footer;
