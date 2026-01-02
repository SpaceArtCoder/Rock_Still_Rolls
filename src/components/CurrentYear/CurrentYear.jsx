import styles from './CurrentYear.module.scss';

/**
 * Компонент для отображения текущего года в формате копирайта.
 * Используется в подвалах сайтов для автоматического обновления года.
 */
function CurrentYear() {
    // Получение текущего года
    const current_year = new Date().getFullYear();

    return (
        <p className={styles.current_year}>
            &copy; <span id={styles.current_year}>{current_year}</span>
        </p>
    );
}

export default CurrentYear;
