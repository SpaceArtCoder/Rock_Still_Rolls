import {Link} from 'react-router-dom';
import Logo from '../Logo/Logo.jsx';
import Categories from '../UI/Categories/Categories.jsx';
import MenuButton from '../MenuButton/MenuButton.jsx';
import IOSThreeStateToggle from '../Auth/IOSThreeStateToggle.jsx';
import SearchButton from '../SearchButton/SearchButton.jsx';
import NotificationBell from '../Notifications/NotificationBell'; // НОВЫЙ ИМПОРТ
import styles from './Header.module.scss';

function Header() {

    return (
        <header className={styles.header}>

            <MenuButton />

            <div className={styles.logo}>
                <Link to="/">{<Logo />}</Link>
            </div>

            <Categories />

            <div className={styles.actions}>
                <SearchButton />
                <NotificationBell />
                <IOSThreeStateToggle />
            </div>
            
        </header>
    )
}

export default Header;

