import { Link } from 'react-router-dom';
import Categories from '../UI/Categories/Categories';
import CurrentYear from '../CurrentYear/CurrentYear';
import styles from './Footer.module.scss';

function Footer() {
    return (
        <footer className={styles.footer}>
            <Categories links_direction={"show_footer_links"}/>
            <Link className={styles.privacy_policy} to="/privacy-policy">Политика конфиденциальности</Link>
            <CurrentYear />
        </footer>
    )
}

export default Footer;