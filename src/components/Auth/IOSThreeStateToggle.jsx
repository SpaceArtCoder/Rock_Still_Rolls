import React, { useState, useRef, useEffect } from 'react';
import AuthModal from './AuthModal/AuthModal';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import styles from './IOSThreeStateToggle.module.scss';

/**
 * Интеллектуальный переключатель авторизации в стиле iOS.
 * Управляет входом, регистрацией и быстрым доступом к профилю/админке.
 */
const IOSThreeStateToggle = ({ onStateChange }) => {
  // Подписка на Zustand store
  const { isAuthenticated, user, isLoading, logout } = useAuthStore();

  const [activeState, setActiveState] = useState('login');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [registrationSuccessName, setRegistrationSuccessName] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const containerRef = useRef(null);

  // Обработка клика вне компонента для закрытия меню/тумблера
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false);
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStateChange = (state) => {
    setActiveState(state);
    setIsExpanded(false);
    setIsOpen(true);
    if (onStateChange) onStateChange(state);
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
  };

  // Состояние загрузки (защита от "прыжков" интерфейса)
  if (isLoading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  // --- РЕЖИМ 1: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН ---
  if (isAuthenticated && user) {
    return (
      <div ref={containerRef} className={styles.wrapper}>
        <button 
          className={styles.avatarButton} 
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          {user.avatarUrl ? (
            <img 
              src={`http://localhost:5000${user.avatarUrl}`} 
              alt="Avatar" 
              className={styles.avatar} 
            />
          ) : (
            <div className={styles.defaultAvatar}>
               {user.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        
        {isProfileMenuOpen && (
          <div className={styles.profileDropdown}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user.name}</p>
              <p className={styles.userEmail}>{user.email}</p>
            </div>
            <div className={styles.divider} />
            
            <Link 
              to={user.isAdmin ? "/manage" : "/profile"} 
              className={styles.profileLink}
              onClick={() => setIsProfileMenuOpen(false)}
            >
              {user.isAdmin ? "🛠️ Админ-панель" : "👤 Мой профиль"}
            </Link>

            <button className={styles.logoutButton} onClick={handleLogout}>
              Выйти
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- РЕЖИМ 2: ГОСТЬ ---
  return (
    <>
      <div ref={containerRef} className={styles.wrapper}>
        <div className={`${styles.toggleContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
          {!isExpanded ? (
            <button className={styles.iconButton} onClick={() => setIsExpanded(true)}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          ) : (
            <div className={styles.buttonsWrapper}>
              <div className={`${styles.activeBackground} ${styles[activeState]}`} />
              <button 
                onClick={() => handleStateChange('login')}
                className={`${styles.toggleButton} ${activeState === 'login' ? styles.active : ''}`}
              >
                Вход
              </button>
              <button 
                onClick={() => handleStateChange('register')}
                className={`${styles.toggleButton} ${activeState === 'register' ? styles.active : ''}`}
              >
                Регистрация
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Уведомление о регистрации */}
      {registrationSuccessName && (
        <div className={styles.notificationOverlay}>
          <div className={styles.notificationCard}>
            <h3>Успешно!</h3>
            <p><strong>{registrationSuccessName}</strong>, аккаунт создан. Теперь вы можете войти.</p>
            <button onClick={() => setRegistrationSuccessName(null)}>Понятно</button>
          </div>
        </div>
      )}

      <AuthModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={activeState}
        onAuthSuccess={() => setIsOpen(false)}
        onRegistrationSuccess={(name) => {
          setRegistrationSuccessName(name);
          setActiveState('login');
        }}
      />
    </>
  );
};

export default IOSThreeStateToggle;
