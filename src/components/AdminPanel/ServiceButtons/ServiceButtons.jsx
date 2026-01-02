import { useState } from 'react';
import EditingWindow from '../EditingWindow/EditingWindow.jsx';
import styles from './ServiceButtons.module.scss';

/**
 * Компонент сервисных кнопок управления статьей.
 * Содержит кнопки: Редактировать, Удалить, Добавить.
 */
function ServiceButtons({ shown = null, article, onDelete, onChange }) {
    const [isClicked, setIsClicked] = useState(false);

    const openEditingWindow = () => setIsClicked(true);
    const closeEditingWindow = () => setIsClicked(false);

    // Определяем CSS классы контейнера в зависимости от пропса shown
    const containerClasses = shown 
        ? `${styles.service_buttons_block} ${styles.no_justify_content}` 
        : styles.service_buttons_block;

    return (
        <>
            <div className={containerClasses}>
                {/* Кнопка РЕДАКТИРОВАТЬ: скрыта, если режим 'add' */}
                <button 
                    onClick={openEditingWindow} 
                    className={shown === 'add' ? styles.shown : styles.editButton} 
                    aria-label="Edit"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                    </svg>
                    <span>Редактировать</span>
                </button>

                {/* Кнопка УДАЛИТЬ: скрыта, если режим 'add' */}
                <button 
                    onClick={() => article && onDelete(article.id)}
                    className={shown === 'add' ? styles.shown : styles.deleteButton} 
                    aria-label="Delete"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                    </svg>
                    <span>Удалить</span>
                </button>

                {/* Кнопка ДОБАВИТЬ: видна только если shown === 'add' */}
                <button 
                    onClick={openEditingWindow} 
                    className={shown === 'add' ? styles.addButton : styles.shown} 
                    aria-label="Add"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                    </svg>
                    <span>Добавить статью</span>
                </button>
            </div>

            {/* Модальное окно редактирования/создания */}
            <EditingWindow 
                click={isClicked} 
                article={article} 
                onClose={closeEditingWindow} 
                onChange={onChange}
            />
        </>
    );
}

export default ServiceButtons;
