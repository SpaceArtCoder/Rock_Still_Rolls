import { create } from 'zustand';
import axios from 'axios';

// Базовый URL API уведомлений
const API_BASE_URL = 'http://localhost:5000/api/notifications';

// Настройка axios для отправки cookies при запросах
axios.defaults.withCredentials = true;

/**
 * Хранилище уведомлений на Zustand
 * Управляет получением, обновлением и удалением уведомлений пользователя
 */
const useNotificationStore = create((set, get) => ({
    // Состояние хранилища
    notifications: [],   // Массив всех уведомлений пользователя
    unreadCount: 0,     // Количество непрочитанных уведомлений
    loading: false,     // Флаг загрузки данных
    error: null,        // Сообщение об ошибке

    /**
     * Загрузить все уведомления пользователя
     * Обновляет список уведомлений и счетчик непрочитанных
     */
    fetchNotifications: async () => {
        set({ loading: true, error: null });
        
        try {
            const response = await axios.get(API_BASE_URL);
            const notifications = response.data;
            
            // Подсчет непрочитанных уведомлений при загрузке
            const unreadCount = notifications.filter(n => !n.read).length;
            
            set({
                notifications,
                unreadCount,
                loading: false
            });
        } catch (error) {
            console.error('Ошибка загрузки уведомлений:', error);
            set({
                error: error.response?.data?.error || 'Не удалось загрузить уведомления',
                loading: false
            });
        }
    },

    /**
     * Получить только количество непрочитанных уведомлений
     * Легкий запрос без загрузки полного списка уведомлений
     */
    fetchUnreadCount: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/unread-count`);
            set({ unreadCount: response.data.count });
        } catch (error) {
            console.error('Ошибка получения количества:', error);
            // Устанавливаем 0 при ошибке
            set({ unreadCount: 0 });
        }
    },

    /**
     * Отметить одно уведомление как прочитанное
     * @param {string} notificationId - ID уведомления
     */
    markAsRead: async (notificationId) => {
        try {
            await axios.put(`${API_BASE_URL}/${notificationId}/read`);
            
            // Обновление локального состояния
            set(state => {
                // Проверяем, было ли уведомление непрочитанным
                const notification = state.notifications.find(n => n.id === notificationId);
                const wasUnread = notification && !notification.read;
                
                return {
                    // Обновляем статус уведомления
                    notifications: state.notifications.map(n =>
                        n.id === notificationId ? { ...n, read: true } : n
                    ),
                    // Уменьшаем счетчик если уведомление было непрочитанным
                    unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
                };
            });
        } catch (error) {
            console.error('Ошибка обновления уведомления:', error);
        }
    },

    /**
     * Отметить все уведомления как прочитанные
     */
    markAllAsRead: async () => {
        try {
            await axios.put(`${API_BASE_URL}/mark-all-read`);
            
            // Обновление локального состояния
            set(state => ({
                // Отмечаем все уведомления как прочитанные
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                // Сбрасываем счетчик непрочитанных
                unreadCount: 0
            }));
        } catch (error) {
            console.error('Ошибка обновления уведомлений:', error);
        }
    },

    /**
     * Удалить одно уведомление
     * @param {string} notificationId - ID уведомления для удаления
     */
    deleteNotification: async (notificationId) => {
        try {
            await axios.delete(`${API_BASE_URL}/${notificationId}`);
            
            // Обновление локального состояния
            set(state => {
                const notification = state.notifications.find(n => n.id === notificationId);
                const wasUnread = notification && !notification.read;
                
                return {
                    // Удаляем уведомление из списка
                    notifications: state.notifications.filter(n => n.id !== notificationId),
                    // Уменьшаем счетчик если уведомление было непрочитанным
                    unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
                };
            });
        } catch (error) {
            console.error('Ошибка удаления уведомления:', error);
        }
    },

    /**
     * Удалить все прочитанные уведомления
     */
    clearRead: async () => {
        try {
            await axios.delete(`${API_BASE_URL}/clear-read`);
            
            // Обновление локального состояния
            set(state => ({
                // Удаляем только прочитанные уведомления
                notifications: state.notifications.filter(n => !n.read)
                // Счетчик непрочитанных остается неизменным
            }));
        } catch (error) {
            console.error('Ошибка удаления уведомлений:', error);
        }
    },

    /**
     * Удалить все уведомления пользователя
     * Используется для кнопки "Удалить все"
     */
    deleteAll: async () => {
        try {
            // Получаем все ID уведомлений для удаления
            const notificationIds = get().notifications.map(n => n.id);
            
            // Удаляем все уведомления параллельно
            await Promise.all(
                notificationIds.map(id => axios.delete(`${API_BASE_URL}/${id}`))
            );
            
            // Сброс состояния
            set({
                notifications: [],
                unreadCount: 0
            });
        } catch (error) {
            console.error('Ошибка удаления всех уведомлений:', error);
        }
    },

    /**
     * Очистить сообщение об ошибке
     */
    clearError: () => set({ error: null })
}));

export default useNotificationStore;
