import FeedbackForm from '../Form/FeedbackForm/FeedbackForm.jsx';
import NeonFlash from '../NeonFlash/NeonFlash.jsx';
import styles from './ContactUs.module.scss';

/**
 * Компонент секции "Свяжитесь с нами".
 * Объединяет анимированный заголовок с формой обратной связи.
 */
function ContactUs() {
    return (
        <section className={styles.contact_us_container}>
            {/* Анимированный неоновый заголовок */}
            <NeonFlash />
            
            {/* Блок с формой обратной связи */}
            <div className={styles.form_block}>
                <FeedbackForm />
            </div>
        </section>
    );
}

export default ContactUs;
