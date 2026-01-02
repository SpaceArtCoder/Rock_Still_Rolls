import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Настройка axios для отправки cookies при каждом запросе
axios.defaults.withCredentials = true;

/**
 * Interceptor для обработки ответов от сервера
 * Отслеживает ошибки авторизации и автоматически сбрасывает состояние при утере сессии
 */
axios.interceptors.response.use(
    /**
     * Обработчик успешного ответа
     * @param {Object} response - Ответ от сервера
     * @returns {Object} Ответ без изменений
     */
    (response) => {
        // Успешный ответ - просто возвращаем без изменений
        return response;
    },
    /**
     * Обработчик ошибок ответа
     * @param {Object} error - Ошибка от сервера
     * @returns {Promise} Отклоненный Promise с ошибкой
     */
    (error) => {
        // Проверяем, если это ошибка 401 (Unauthorized)
        if (error.response?.status === 401) {
            // Получаем текущее состояние хранилища аутентификации
            const authState = useAuthStore.getState();

            // Если в состоянии указано, что пользователь авторизован,
            // но сервер вернул 401 - значит сессия утеряна
            if (authState.isAuthenticated) {
                console.log('Обнаружена утерянная сессия - сброс состояния');

                // Выполняем локальный выход пользователя
                authState.logout();

                // Оповещаем другие вкладки браузера о выходе пользователя
                authState.broadcastAuthChange('logout');
            }
        }

        // Пробрасываем ошибку дальше для обработки в вызывающем коде
        return Promise.reject(error);
    }
);

/**
 * Экспорт настроенного экземпляра axios
 * Используется во всем приложении для выполнения HTTP-запросов
 */
export default axios;
