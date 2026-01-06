import styles from './FeedbackForm.module.scss';
import FeedbackSubmitButton from '../../Button/FeedbackSubmitButton.jsx';
import { useState } from 'react';

function FeedbackForm() {
    const [emailValue, setEmailValue] = useState('');
    const [commentsValue, setCommentsValue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form Submitted!', commentsValue, commentsValue);
    };

    return (
        <form onSubmit={handleSubmit} id={styles.feedback_form} action="/submit-feedback" method="post">
            <h2>Обратная связь действительно важна</h2>

            {/* <fieldset className={styles.form_group}>
                <legend>How would you rate your experience? *</legend>
                <div className={styles.rating_group}>
                    <input type="radio" className={styles.rating_1} name="satisfaction" value="1" required/>
                    <label htmlFor="rating-1">1 (Плохо)</label>

                    <input type="radio" className={styles.rating_2} name="satisfaction" value="2"/>
                    <label htmlFor="rating-2">2 (Есть что улучшить)</label>
            
                    <input type="radio" className={styles.rating_3} name="satisfaction" value="3"/>
                    <label htmlFor="rating-3">3 (Нормально)</label>

                    <input type="radio" className={styles.rating_4} name="satisfaction" value="4"/>
                    <label htmlFor="rating-4">4 (Хорошо)</label>
            
                    <input type="radio" className={styles.rating_5} name="satisfaction" value="5"/>
                    <label htmlFor="rating-5">5 (Отлично)</label>
                </div>
            </fieldset> */}

            <div className={styles.form_group}>
                {/* <label htmlFor="comments"></label> */}
                <textarea 
                id={styles.comments} 
                value={commentsValue}
                onChange={(e) => setCommentsValue(e.target.value)} 
                name="comments" 
                rows="5" 
                placeholder="Отзывы и предложения..."></textarea>
            </div>

            <div className={styles.form_group}>
                <label htmlFor="email">Электронная почта</label>
                <input 
                type="email" 
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)} 
                id={styles.email} 
                name="contact_email" 
                placeholder="your.email@example.com"/>
            </div>

            {/* <button type="submit" className={styles.submit_button}>Send Feedback</button> */}

            <FeedbackSubmitButton 
                text="Send Data"
                // Disable button if input is empty
                disabled={emailValue.trim() === '' || commentsValue.trim() === ''} 
            />
      
        </form>
    )

}

export default FeedbackForm;