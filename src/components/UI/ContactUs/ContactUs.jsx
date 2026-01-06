import FeedbackForm from '../Form/FeedbackForm/FeedbackForm.jsx';
import NeonFlash from '../NeonFlash/NeonFlash.jsx';
import styles from './ContactUs.module.scss';

function ContactUs() {
    return (
        <section className={styles.contact_us_container}>
            <NeonFlash />
            <div className={styles.form_block}>
                <FeedbackForm />
            </div>
        </section>
    )
}

export default ContactUs;