import {Link} from 'react-router-dom';
import styles from './Categories.module.scss';

function Categories({links_direction}) {
    return (
        // <nav className={links_direction ? `${styles.nav_block} ${styles.show_footer_links}` : styles.nav_block}>
        <nav className={links_direction ? `${styles.nav_block} ${styles[links_direction]}` : styles.nav_block}>
                <ul className={links_direction ? `${styles.nav_links} ${styles.footer_links_flex_direction}` : styles.nav_links}>
                    <li>
                        <Link to="/news">Новости</Link>
                    </li>
                    <li>
                        <Link to="/performers">Исполнители</Link>
                    </li>
                    <li>
                        <Link to="/events">События</Link>
                    </li>
                    <li>
                        <Link to="/about">О проекте</Link>
                    </li>
                </ul>
            </nav>
    )
}

export default Categories;