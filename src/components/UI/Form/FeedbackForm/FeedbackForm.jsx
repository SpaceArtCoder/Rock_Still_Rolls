import styles from './FeedbackForm.module.scss';
import FeedbackSubmitButton from '../../Button/FeedbackSubmitButton.jsx';
import { useState } from 'react';

/**
 * Компонент формы обратной связи
 * Позволяет пользователям оставлять отзывы и предложения
 */
function FeedbackForm() {
    // Состояния для полей формы
    const [emailValue, setEmailValue] = useState('');
    const [commentsValue, setCommentsValue] = useState('');

    /**
     * Обработчик отправки формы
     * @param {Event} e - Событие отправки формы
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Submitted!', emailValue, commentsValue);
    };

    return (
        <form 
            onSubmit={handleSubmit} 
            id={styles.feedback_form} 
            action="/submit-feedback" 
            method="post"
        >
            {/* Заголовок формы */}
            <h2>Обратная связь действительно важна</h2>

            {/* Поле для комментариев */}
            <div className={styles.form_group}>
                <textarea 
                    id={styles.comments} 
                    value={commentsValue}
                    onChange={(e) => setCommentsValue(e.target.value)} 
                    name="comments" 
                    rows="5" 
                    placeholder="Отзывы и предложения..."
                />
            </div>

            {/* Поле для email */}
            <div className={styles.form_group}>
                <label htmlFor="email">Электронная почта</label>
                <input 
                    type="email" 
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)} 
                    id={styles.email} 
                    name="contact_email" 
                    placeholder="your.email@example.com"
                />
            </div>

            {/* Кнопка отправки формы */}
            <FeedbackSubmitButton 
                text="Send Data"
                // Кнопка отключена, если поля пустые
                disabled={emailValue.trim() === '' || commentsValue.trim() === ''} 
            />
        </form>
    );
}

export default FeedbackForm;
