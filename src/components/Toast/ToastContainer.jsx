import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import styles from './ToastContainer.module.scss';

// Контекст для управления тостами
const ToastContext = createContext();

/**
 * Хук для использования функциональности тостов.
 * @returns {Object} Объект с методами для отображения тостов.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Провайдер для управления тостами.
 * Обеспечивает контекст для дочерних компонентов и отображает контейнер с тостами.
 * @param {Object} props - Свойства компонента.
 * @param {React.ReactNode} props.children - Дочерние элементы.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Добавляет новый тост в коллекцию.
   * @param {string} message - Сообщение тоста.
   * @param {string} type - Тип тоста: 'error', 'success', 'warning', 'info'.
   * @param {number} duration - Длительность отображения в миллисекундах.
   * @returns {number} Уникальный идентификатор тоста.
   */
  const addToast = useCallback((message, type = 'error', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  /**
   * Удаляет тост по идентификатору.
   * @param {number} id - Идентификатор тоста для удаления.
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Объект с удобными методами для отображения тостов разных типов.
   */
  const toast = {
    error: (message, duration) => addToast(message, 'error', duration),
    success: (message, duration) => addToast(message, 'success', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Контейнер для отображения всех активных тостов */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
