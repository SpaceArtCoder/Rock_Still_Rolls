import { useEffect } from 'react';
import CloseButton from '../../UI/Button/CloseButton.jsx';
import NewsArticleForm from '../NewsArticleForm/NewsArticleForm.jsx';
import styles from './EditingWindow.module.scss';

/**
 * Компонент модального окна для редактирования статьи.
 * * @param {Object} props
 * @param {boolean} props.click - Состояние открытия окна (true - открыто)
 * @param {Object} props.article - Объект с данными редактируемой статьи
 * @param {Function} props.onClose - Функция закрытия окна
 * @param {Function} props.onChange - Функция сохранения изменений в статье
 */
function EditingWindow({ click, article, onClose, onChange }) {

    // Блокировка прокрутки основного контента при открытом окне
    useEffect(() => {
        if (click) {
            document.body.classList.add('no_scroll');
        } else {
            document.body.classList.remove('no_scroll');
        }

        // Чистка эффекта (удаление класса при размонтировании компонента)
        return () => {
            document.body.classList.remove('no_scroll');
        };
    }, [click]);

    return (
        <section 
            className={click ? `${styles.edit_container} ${styles.show}` : styles.edit_container}
        >
            {/* Кнопка закрытия окна */}
            <CloseButton onClose={onClose} />

            {/* Форма редактирования контента */}
            <NewsArticleForm 
                article={article} 
                onChange={onChange} 
            />
        </section>
    );
}

export default EditingWindow;
