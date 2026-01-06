import MyIcon from '../../assets/images/logo.svg';
import styles from '../Logo/Logo.module.scss';

function Logo() {
    return (
        <div className={styles.logo}>
            <img src={MyIcon} alt='Site Logo'/>
        </div>
    )
}

export default Logo;