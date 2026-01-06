// src/components/AuthModal/ForgotPasswordModal.jsx
import { useState } from 'react';
import axios from 'axios';
import styles from './AuthModal.module.scss';

const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const response = await axios.post('https://uncramped-robbin-patrimonial.ngrok-free.dev/api/auth/forgot-password', {
                email: email.trim().toLowerCase()
            }, {
                withCredentials: true
            });

            setSuccessMessage(response.data.message);
            setEmail('');

            // Закрываем модалку через 3 секунды после успеха
            setTimeout(() => {
                onClose();
                if (onSuccess) onSuccess();
            }, 3000);

        } catch (err) {
            console.error('Forgot password error:', err);
            setError(err.response?.data?.error || 'Произошла ошибка. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        setSuccessMessage('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeButton}
                    onClick={handleClose}
                    aria-label="Закрыть"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <div className={styles.header}>
                    <h2 className={styles.title}>🔐 Восстановление пароля</h2>
                    <p className={styles.subtitle}>
                        Введите email, использованный при регистрации
                    </p>
                </div>

                {successMessage ? (
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>✅</div>
                        <p className={styles.successMessage}>{successMessage}</p>
                        <p className={styles.successHint}>
                            Проверьте вашу почту. Письмо может попасть в папку "Спам".
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label htmlFor="forgot-email" className={styles.label}>
                                Email адрес
                            </label>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="your@email.com"
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {error && (
                            <div className={styles.errorMessage}>
                                <svg
                                    className={styles.errorIcon}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4M12 16h.01" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className={styles.infoBox}>
                            <svg
                                className={styles.infoIcon}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <p className={styles.infoText}>
                                Мы отправим вам новый пароль на указанный email.
                                После входа рекомендуем сменить пароль в настройках профиля.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading || !email.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <span className={styles.spinner}></span>
                                    Отправка...
                                </>
                            ) : (
                                '📧 Отправить новый пароль'
                            )}
                        </button>

                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={handleClose}
                        >
                            ← Назад к входу
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordModal;