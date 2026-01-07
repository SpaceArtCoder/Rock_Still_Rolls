import { useEffect } from 'react';
import styles from './Toast.module.scss';

/**
 * Компонент тоста (уведомления) с поддержкой различных типов сообщений.
 * Автоматически закрывается через заданное время.
 */
const Toast = ({ message, type = 'error', duration = 4000, onClose }) => {
  /**
   * Эффект для автоматического закрытия тоста через заданное время.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      {/* Иконка в зависимости от типа тоста */}
      <div className={styles.icon}>
        {type === 'error' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
        {type === 'success' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {type === 'warning' && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      
      {/* Содержимое тоста с текстом сообщения */}
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>

      {/* Кнопка ручного закрытия тоста */}
      <button className={styles.closeButton} onClick={onClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Прогресс-бар для визуализации времени жизни тоста */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progress} 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export default Toast;
