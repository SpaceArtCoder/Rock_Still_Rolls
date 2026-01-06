// src/store/useAuthStore.js (ИСПРАВЛЕНА ОШИБКА С NULL)
import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/auth';

const getInitialState = () => {
    return {
        user: null,
        isAuthenticated: false,
        // isLoading: false,
        isLoading: true, // ✅ Начинаем с загрузки!
    };
};

// Настройка axios для отправки cookies
axios.defaults.withCredentials = true;

// Ключ для синхронизации между вкладками
const AUTH_SYNC_KEY = 'auth_sync_event';

const useAuthStore = create((set, get) => ({
    ...getInitialState(),

    // Инициализация слушателя событий
    initAuthSync: () => {
        // Слушаем изменения в localStorage для синхронизации между вкладками
        const handleStorageChange = (e) => {
            if (e.key === AUTH_SYNC_KEY) {
                // ИСПРАВЛЕНО: Проверка на null перед парсингом
                if (!e.newValue) {
                    // console.log('Storage event без данных, пропускаем');
                    return;
                }

                try {
                    const eventData = JSON.parse(e.newValue);

                    // ДОБАВЛЕНО: Дополнительная проверка структуры данных
                    if (!eventData || !eventData.type) {
                        console.log('Некорректная структура данных события');
                        return;
                    }

                    if (eventData.type === 'logout') {
                        // Синхронизируем выход
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    } else if (eventData.type === 'login') {
                        // Синхронизируем вход
                        get().fetchUser();
                    }
                } catch (error) {
                    console.error('Ошибка парсинга события синхронизации:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Возвращаем функцию очистки
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    },

    // Отправка события синхронизации
    broadcastAuthChange: (type) => {
        try {
            // localStorage события видны только в ДРУГИХ вкладках
            const eventData = JSON.stringify({
                type,
                timestamp: Date.now()
            });

            localStorage.setItem(AUTH_SYNC_KEY, eventData);

            // Сразу удаляем, чтобы не захламлять localStorage
            setTimeout(() => {
                localStorage.removeItem(AUTH_SYNC_KEY);
            }, 100);
        } catch (error) {
            console.error('Ошибка отправки события синхронизации:', error);
        }
    },

    // Загрузка данных пользователя по cookie
    fetchUser: async () => {
        set({ isLoading: true });

        try {
            const response = await axios.get(`${API_BASE_URL}/me`);
            const userData = response.data.user;

            set({
                user: userData,
                isAuthenticated: true,
                isLoading: false,
            });

        } catch (error) {
            // Не логируем 401 - это нормально для неавторизованных
            if (error.response?.status !== 401) {
                console.error("Ошибка при получении данных пользователя:", error);
            }

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    // Функция для обработки входа
    login: async (email, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/login`, {
                email,
                password
            });

            const userData = response.data.user;

            // Cookie установлен сервером автоматически
            set({
                user: userData,
                isAuthenticated: true,
            });

            // Оповещаем другие вкладки о входе
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

    // Функция для обработки регистрации
    register: async (formData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/register`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const userData = response.data.user;

            // Возвращаем только данные пользователя без авторизации
            return { success: true, user: userData, requireLogin: true };

        } catch (error) {
            console.error("Ошибка при регистрации:", error);
            return {
                success: false,
                errors: error.response?.data?.errors || { general: 'Ошибка сервера' }
            };
        }
    },

    // Функция выхода
    logout: async () => {
        try {
            await axios.post(`${API_BASE_URL}/logout`);

            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            });

            // Оповещаем другие вкладки о выходе
            get().broadcastAuthChange('logout');

            return { success: true };

        } catch (error) {
            console.error("Ошибка при выходе:", error);

            // Даже если запрос не прошел, очищаем локальное состояние
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

    // Функция для установки данных пользователя (если нужно)
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