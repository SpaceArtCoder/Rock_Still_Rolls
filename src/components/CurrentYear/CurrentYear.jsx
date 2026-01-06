import styles from './CurrentYear.module.scss';

function CurrentYear() {

    const current_year = new Date().getFullYear();

    return (
        <p className={styles.current_year}>&copy; <span id={styles.current_year}>{current_year}</span></p>
    )
}

export default CurrentYear;