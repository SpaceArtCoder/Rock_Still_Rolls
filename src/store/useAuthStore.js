import { create } from 'zustand';
import axios from 'axios';

// Базовый URL API аутентификации
const API_BASE_URL = 'http://localhost:5000/api/auth';

// Ключ для синхронизации аутентификации между вкладками браузера
const AUTH_SYNC_KEY = 'auth_sync_event';

/**
 * Получение начального состояния хранилища
 * @returns {Object} Начальное состояние аутентификации
 */
const getInitialState = () => {
    return {
        user: null,              // Данные пользователя
        isAuthenticated: false,  // Статус аутентификации
        isLoading: true,         // Флаг загрузки (начинаем с true)
    };
};

// Настройка axios для отправки cookies при запросах
axios.defaults.withCredentials = true;

/**
 * Хранилище аутентификации на Zustand
 * Управляет состоянием пользователя, входом, выходом и синхронизацией между вкладками
 */
const useAuthStore = create((set, get) => ({
    ...getInitialState(),

    /**
     * Инициализация синхронизации аутентификации между вкладками
     * Добавляет обработчик событий localStorage для обновления состояния
     * @returns {Function} Функция очистки обработчика событий
     */
    initAuthSync: () => {
        // Обработчик изменений в localStorage
        const handleStorageChange = (e) => {
            if (e.key === AUTH_SYNC_KEY) {
                // Проверка на null перед парсингом данных
                if (!e.newValue) {
                    return;
                }

                try {
                    const eventData = JSON.parse(e.newValue);

                    // Дополнительная проверка структуры данных события
                    if (!eventData || !eventData.type) {
                        console.log('Некорректная структура данных события');
                        return;
                    }

                    // Обработка события выхода
                    if (eventData.type === 'logout') {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    } 
                    // Обработка события входа
                    else if (eventData.type === 'login') {
                        get().fetchUser();
                    }
                } catch (error) {
                    console.error('Ошибка парсинга события синхронизации:', error);
                }
            }
        };

        // Добавление обработчика событий
        window.addEventListener('storage', handleStorageChange);

        // Возвращаем функцию очистки обработчика
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    },

    /**
     * Отправка события изменения аутентификации для синхронизации между вкладками
     * @param {string} type - Тип события ('login' или 'logout')
     */
    broadcastAuthChange: (type) => {
        try {
            // Создание данных события
            const eventData = JSON.stringify({
                type,
                timestamp: Date.now()
            });

            // Запись события в localStorage (видно в других вкладках)
            localStorage.setItem(AUTH_SYNC_KEY, eventData);

            // Очистка события через 100мс для предотвращения захламления
            setTimeout(() => {
                localStorage.removeItem(AUTH_SYNC_KEY);
            }, 100);
        } catch (error) {
            console.error('Ошибка отправки события синхронизации:', error);
        }
    },

    /**
     * Загрузка данных пользователя по cookie
     * Проверяет аутентификацию пользователя через сервер
     */
    fetchUser: async () => {
        set({ isLoading: true });

        try {
            const response = await axios.get(`${API_BASE_URL}/me`);
            const userData = response.data.user;

            // Обновление состояния при успешной аутентификации
            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
            });

        } catch (error) {
            // Не логируем 401 ошибку - это нормально для неавторизованных пользователей
            if (error.response?.status !== 401) {
                console.error("Ошибка при получении данных пользователя:", error);
            }

            // Сброс состояния при неудачной аутентификации
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    /**
     * Вход пользователя в систему
     * @param {string} email - Email пользователя
     * @param {string} password - Пароль пользователя
     * @returns {Object} Результат операции входа
     */
    login: async (email, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                email,
                password
            });

            const userData = response.data.user;

            // Обновление состояния при успешном входе
            set({
                user: userData,
                isAuthenticated: true,
            });

            // Оповещение других вкладок о входе
            get().broadcastAuthChange('login');

            return { success: true, user: userData };

        } catch (error) {
            console.error("Ошибка при входе:", error);
            return {
                success: false,
                errors: error.response?.data?.errors || { general: 'Ошибка сервера' }
            };
        }
    },

    /**
     * Регистрация нового пользователя
     * @param {FormData} formData - Данные формы регистрации
     * @returns {Object} Результат операции регистрации
     */
    register: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const userData = response.data.user;

            // Возвращаем данные пользователя без автоматической авторизации
            return { success: true, user: userData, requireLogin: true };

        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            return {
                success: false,
                errors: error.response?.data?.errors || { general: 'Ошибка сервера' }
            };
        }
    },

    /**
     * Выход пользователя из системы
     * @returns {Object} Результат операции выхода
     */
    logout: async () => {
        try {
            // Отправка запроса на выход
            await axios.post(`${API_BASE_URL}/logout`);

            // Очистка локального состояния
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            // Оповещение других вкладок о выходе
            get().broadcastAuthChange('logout');

            return { success: true };

        } catch (error) {
            console.error("Ошибка при выходе:", error);

            // Очистка состояния даже при ошибке запроса
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            // Все равно оповещаем другие вкладки
            get().broadcastAuthChange('logout');

            return { success: false };
        }
    },

    /**
     * Ручная установка данных пользователя
     * @param {Object} user - Объект с данными пользователя
     */
    setUser: (user) => {
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            isAdmin: user.isAdmin,
        };
        set({ user: userData, isAuthenticated: true });
    }

}));

export default useAuthStore;
