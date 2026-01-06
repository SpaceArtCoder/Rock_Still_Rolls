// src/store/useNotificationStore.js (ИСПРАВЛЕННЫЙ)
import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'https://uncramped-robbin-patrimonial.ngrok-free.dev/api/notifications';

// Настройка axios для отправки cookies
axios.defaults.withCredentials = true;

const useNotificationStore = create((set, get) => ({
  // Состояние
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // 1. Загрузить все уведомления
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await axios.get(API_BASE_URL);
      const notifications = response.data;
      
      // ИСПРАВЛЕНО: Всегда подсчитываем непрочитанные при загрузке
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({
        notifications,
        unreadCount, // ИСПРАВЛЕНО: Обновляем счетчик
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

  // 2. Получить только количество непрочитанных (легкий запрос)
  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/unread-count`);
      set({ unreadCount: response.data.count });
    } catch (error) {
      console.error('Ошибка получения количества:', error);
      // ДОБАВЛЕНО: При ошибке устанавливаем 0
      set({ unreadCount: 0 });
    }
  },

  // 3. Отметить уведомление как прочитанное
  markAsRead: async (notificationId) => {
    try {
      await axios.put(`${API_BASE_URL}/${notificationId}/read`);
      
      // Обновляем локальное состояние
      set(state => {
        // УЛУЧШЕНО: Проверяем, было ли уведомление непрочитанным
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Ошибка обновления уведомления:', error);
    }
  },

  // 4. Отметить все как прочитанные
  markAllAsRead: async () => {
    try {
      await axios.put(`${API_BASE_URL}/mark-all-read`);
      
      // Обновляем локальное состояние
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Ошибка обновления уведомлений:', error);
    }
  },

  // 5. Удалить уведомление
  deleteNotification: async (notificationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/${notificationId}`);
      
      // Обновляем локальное состояние
      set(state => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  },

  // 6. Удалить все прочитанные
  clearRead: async () => {
    try {
      await axios.delete(`${API_BASE_URL}/clear-read`);
      
      // Обновляем локальное состояние
      // ИСПРАВЛЕНО: Счетчик не меняется, т.к. удаляем только прочитанные
      set(state => ({
        notifications: state.notifications.filter(n => !n.read)
        // unreadCount остается прежним
      }));
    } catch (error) {
      console.error('Ошибка удаления уведомлений:', error);
    }
  },

  // 7. НОВОЕ: Удалить все уведомления (для кнопки "Удалить все")
  deleteAll: async () => {
    try {
      // Получаем все ID уведомлений
      const notificationIds = get().notifications.map(n => n.id);
      
      // Удаляем каждое уведомление
      await Promise.all(
        notificationIds.map(id => axios.delete(`${API_BASE_URL}/${id}`))
      );
      
      // Обновляем локальное состояние
      set({
        notifications: [],
        unreadCount: 0
      });
    } catch (error) {
      console.error('Ошибка удаления всех уведомлений:', error);
    }
  },

  // 8. Очистить ошибку
  clearError: () => set({ error: null })
}));

export default useNotificationStore;