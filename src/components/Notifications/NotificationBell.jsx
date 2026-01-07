import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotificationStore from '../../store/useNotificationStore';
import useAuthStore from '../../store/useAuthStore';
import styles from './NotificationBell.module.scss';

/**
 * Компонент уведомлений с выпадающим меню.
 * Отображает количество непрочитанных уведомлений и список всех уведомлений.
 */
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Состояние аутентификации пользователя
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  // Состояние уведомлений из хранилища
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearRead,
    deleteAll
  } = useNotificationStore();

  /**
   * Эффект для загрузки количества непрочитанных уведомлений.
   * Выполняется при монтировании и обновляется каждые 30 секунд.
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  /**
   * Эффект для загрузки полного списка уведомлений при открытии меню.
   */
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated, fetchNotifications]);

  /**
   * Эффект для закрытия меню при клике вне компонента.
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Скрываем компонент, если пользователь не авторизован
  if (!isAuthenticated) {
    return null;
  }

  /**
   * Обрабатывает клик по уведомлению.
   * Отмечает уведомление как прочитанное и выполняет переход по ссылке.
   */
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    setIsOpen(false);
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  /**
   * Отмечает все уведомления как прочитанные.
   */
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  /**
   * Удаляет все прочитанные уведомления.
   */
  const handleClearRead = async () => {
    await clearRead();
  };

  /**
   * Удаляет все уведомления.
   */
  const handleDeleteAll = async () => {
    if (window.confirm('Удалить все уведомления?')) {
      await deleteAll();
    }
  };

  /**
   * Форматирует время создания уведомления в относительный формат.
   */
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  /**
   * Возвращает иконку в зависимости от типа уведомления.
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'COMMENT_LIKE':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.likeIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'COMMENT_REPLY':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.replyIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'NEW_COMMENT':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.commentIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.notificationBell} ref={dropdownRef}>
      {/* Кнопка-колокольчик с бейджем количества */}
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Уведомления"
      >
        <svg className={styles.bellIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Бейдж с количеством непрочитанных */}
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню с уведомлениями */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Уведомления</h3>
            <div className={styles.headerActions}>
              {unreadCount > 0 && (
                <button
                  className={styles.markAllButton}
                  onClick={handleMarkAllRead}
                  title="Отметить все как прочитанные"
                >
                  Отметить все
                </button>
              )}
            </div>
          </div>

          <div className={styles.notifications}>
            {loading ? (
              // Индикатор загрузки
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Загрузка...</p>
              </div>
            ) : notifications.length === 0 ? (
              // Сообщение об отсутствии уведомлений
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>Нет уведомлений</p>
              </div>
            ) : (
              // Список уведомлений
              <>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`${styles.notification} ${!notification.read ? styles.unread : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.iconWrapper}>
                      {/* Аватар отправителя */}
                      {notification.fromUser?.avatarUrl ? (
                        <img
                          src={`http://localhost:5000${notification.fromUser.avatarUrl}`}
                          alt={notification.fromUser.name}
                          className={styles.avatar}
                        />
                      ) : (
                        <div className={styles.defaultAvatar}>
                          {notification.fromUser?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className={styles.typeIcon}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    <div className={styles.content}>
                      <p className={styles.message}>{notification.message}</p>
                      
                      {/* Превью комментария */}
                      {notification.comment && (
                        <p className={styles.preview}>
                          "{notification.comment.content.substring(0, 60)}{notification.comment.content.length > 60 ? '...' : ''}"
                        </p>
                      )}
                      
                      {/* Время создания */}
                      <span className={styles.time}>
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>

                    {/* Кнопка удаления уведомления */}
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      title="Удалить уведомление"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Футер с кнопками управления */}
          {notifications.length > 0 && (
            <div className={styles.footer}>
              <button onClick={handleClearRead} title="Удалить прочитанные">
                Очистить прочитанные
              </button>
              <button onClick={handleDeleteAll} className={styles.deleteAllButton} title="Удалить все">
                Удалить все
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
