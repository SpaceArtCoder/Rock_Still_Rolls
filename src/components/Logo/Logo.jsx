import MyIcon from '../../assets/images/logo.svg';
import styles from '../Logo/Logo.module.scss';

/**
 * Компонент логотипа сайта.
 * Отображает SVG-изображение логотипа с альтернативным текстом.
 */
function Logo() {
    return (
        <div className={styles.logo}>
            <img src={MyIcon} alt='Логотип сайта'/>
        </div>
    );
}

export default Logo;
