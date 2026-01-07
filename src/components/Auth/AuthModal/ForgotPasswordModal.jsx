import { useState } from 'react';
import axios from 'axios';
import styles from './AuthModal.module.scss';

/**
 * Модальное окно для восстановления пароля пользователя.
 * Позволяет отправить запрос на сброс пароля по email.
 */
const ForgotPasswordModal = ({ isOpen, onClose, onSuccess }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    /**
     * Обрабатывает отправку формы восстановления пароля.
     * Отправляет запрос на сервер для сброса пароля.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
                email: email.trim().toLowerCase()
            }, {
                withCredentials: true
            });

            setSuccessMessage(response.data.message || 'Новый пароль отправлен на вашу почту!');
            setEmail('');

            // Автоматическое закрытие модального окна после успешной отправки
            setTimeout(() => {
                handleClose();
                if (onSuccess) onSuccess();
            }, 4000);

        } catch (err) {
            console.error('Ошибка восстановления пароля:', err);
            setError(err.response?.data?.error || 'Произошла ошибка. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Обрабатывает закрытие модального окна.
     * Сбрасывает все состояния формы.
     */
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
                {/* Кнопка закрытия модального окна */}
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
                        Введите email для получения нового пароля
                    </p>
                </div>

                {successMessage ? (
                    // Отображение при успешной отправке запроса
                    <div className={styles.successContainer}>
                        <span className={styles.successIcon}>✅</span>
                        <p className={styles.successMessage}>{successMessage}</p>
                        <p className={styles.successHint}>
                            Проверьте вашу почту. Письмо может попасть в папку "Спам" или "Рассылки".
                        </p>
                        <button 
                            className={styles.backButton} 
                            onClick={handleClose}
                        >
                            Вернуться ко входу
                        </button>
                    </div>
                ) : (
                    // Форма для ввода email
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="forgot-email" className={styles.label}>
                                Email адрес
                            </label>
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`${styles.input} ${error ? styles.inputError : ''}`}
                                placeholder="your@email.com"
                                required
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {/* Отображение ошибки сервера */}
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

                        {/* Информационное сообщение */}
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
                                Мы сгенерируем новый временный пароль. 
                                Обязательно смените его в профиле после входа.
                            </p>
                        </div>

                        {/* Кнопка отправки формы */}
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
                                '📧 Получить новый пароль'
                            )}
                        </button>

                        {/* Кнопка возврата к форме входа */}
                        <button
                            type="button"
                            className={styles.backButton}
                            onClick={handleClose}
                            disabled={isLoading}
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
