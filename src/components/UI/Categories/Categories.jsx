import { Link } from 'react-router-dom';
import styles from './Categories.module.scss';

/**
 * Компонент навигации по категориям сайта.
 * Отображает ссылки на основные разделы с возможностью кастомизации стилей.
 * @param {Object} props - Свойства компонента
 * @param {string} props.links_direction - Класс CSS для модификации стилей навигации
 */
function Categories({ links_direction }) {
    return (
        <nav className={links_direction ? `${styles.nav_block} ${styles[links_direction]}` : styles.nav_block}>
            <ul className={links_direction ? `${styles.nav_links} ${styles.footer_links_flex_direction}` : styles.nav_links}>
                {/* Ссылка на раздел новостей */}
                <li>
                    <Link to="/news">Новости</Link>
                </li>
                {/* Ссылка на раздел исполнителей */}
                <li>
                    <Link to="/performers">Исполнители</Link>
                </li>
                {/* Ссылка на раздел событий */}
                <li>
                    <Link to="/events">События</Link>
                </li>
                {/* Ссылка на страницу о проекте */}
                <li>
                    <Link to="/about">О проекте</Link>
                </li>
            </ul>
        </nav>
    );
}

export default Categories;
