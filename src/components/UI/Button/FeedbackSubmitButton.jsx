import React from 'react';
import styles from'./FeedbackSubmitButton.module.scss';

/**
 * Компонент стилизованной кнопки отправки формы обратной связи.
 * Поддерживает различные состояния и типы кнопки.
 * @param {Object} props - Свойства компонента
 * @param {string} props.text - Текст на кнопке (по умолчанию "Submit")
 * @param {boolean} props.disabled - Флаг отключения кнопки
 * @param {Function} props.onClick - Функция, вызываемая при клике
 * @param {string} props.type - HTML-атрибут type (по умолчанию "submit")
 */
function FeedbackSubmitButton({text = "Submit", disabled = false, onClick, type = "submit"}) {
    return (
        <button
            className={styles.material_button}
            type={type}
            disabled={disabled}
            onClick={onClick}
        >
            {/* Основной текст кнопки */}
            {text}
        </button>
    );
};

export default FeedbackSubmitButton;
