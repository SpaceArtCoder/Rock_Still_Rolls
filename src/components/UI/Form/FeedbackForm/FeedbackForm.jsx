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