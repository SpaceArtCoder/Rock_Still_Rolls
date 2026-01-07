import { Link } from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import Categories from '../UI/Categories/Categories.jsx';
import MenuButton from '../MenuButton/MenuButton.jsx';
import IOSThreeStateToggle from '../Auth/IOSThreeStateToggle.jsx';
import SearchButton from '../SearchButton/SearchButton.jsx';
import NotificationBell from '../Notifications/NotificationBell';
import styles from './Header.module.scss';

/**
 * Компонент шапки сайта (Header).
 * Содержит логотип, навигацию по категориям и блок действий пользователя.
 */
function Header() {
    return (
        <header className={styles.header}>
            {/* Кнопка меню для мобильной версии */}
            <MenuButton />

            {/* Логотип сайта с ссылкой на главную страницу */}
            <div className={styles.logo}>
                <Link to="/">{<Logo />}</Link>
            </div>

            {/* Компонент категорий для навигации */}
            <Categories />

            {/* Блок действий пользователя */}
            <div className={styles.actions}>
                {/* Кнопка поиска */}
                <SearchButton />
                
                {/* Компонент уведомлений */}
                <NotificationBell />
                
                {/* Компонент авторизации */}
                <IOSThreeStateToggle />
            </div>
        </header>
    );
}

export default Header;
