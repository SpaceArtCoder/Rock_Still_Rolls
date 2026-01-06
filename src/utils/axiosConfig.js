// src/utils/axiosConfig.js (НОВЫЙ ФАЙЛ)
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Настройка axios для отправки cookies
axios.defaults.withCredentials = true;

// НОВОЕ: Interceptor для обработки ошибок авторизации
axios.interceptors.response.use(
    (response) => {
        // Успешный ответ - просто возвращаем
        return response;
    },
    (error) => {
        // Если получили 401 (Unauthorized)
        if (error.response?.status === 401) {
            // Получаем текущее состояние авторизации
            const authState = useAuthStore.getState();

            // Если пользователь думает, что авторизован - сбрасываем состояние
            if (authState.isAuthenticated) {
                console.log('Обнаружена утерянная сессия - сброс состояния');

                // Сбрасываем состояние авторизации
                authState.logout();

                // Оповещаем другие вкладки
                authState.broadcastAuthChange('logout');
            }
        }

        // Возвращаем ошибку дальше
        return Promise.reject(error);
    }
);

export default axios;