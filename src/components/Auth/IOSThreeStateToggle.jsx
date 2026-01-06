import React, { useState, useRef, useEffect } from 'react';
import AuthModal from './AuthModal/AuthModal';
import useAuthStore from '../../store/useAuthStore';
import { Link } from 'react-router-dom';
import styles from './IOSThreeStateToggle.module.scss';

const IOSThreeStateToggle = ({ onStateChange }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);
  const logout = useAuthStore(state => state.logout);

  const [activeState, setActiveState] = useState('login');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [registrationSuccessName, setRegistrationSuccessName] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const containerRef = useRef(null);


  const handleStateChange = (state) => {
    setActiveState(state);
    setIsExpanded(false);
    setIsOpen(true);
    if (onStateChange) {
      onStateChange(state);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // ИСПРАВЛЕННАЯ функция выхода с async/await
  const handleLogout = async () => {
    await logout(); // ВАЖНО: await для корректного выхода
    setIsProfileMenuOpen(false);
  };

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsExpanded(false);
        setIsProfileMenuOpen(false);
      }
    };

    if (isExpanded || isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, isProfileMenuOpen]);


  // Функция успешной регистрации
  const handleRegistrationSuccess = (userName) => {
      setRegistrationSuccessName(userName);
      setActiveState('login');
  };

  // ИСПРАВЛЕННАЯ функция успешного входа (теперь не принимает token)
  const handleAuthSuccess = () => {
     
      
      setIsOpen(false); // Закрываем модалку
      setRegistrationSuccessName(null); // Сбрасываем уведомление
  };

  
  // Отображение заглушки во время загрузки
  if (isLoading) {
      return (
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingSpinner}></div>
        </div>
      ); 
  }


  // Если пользователь авторизован, показываем аватарку и выпадающее меню
  if (isAuthenticated && user) { // ДОБАВЛЕНО: && user для дополнительной проверки
    return (
      <div ref={containerRef} className={styles.wrapper}>
        <button 
            className={styles.iconButton} 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} 
        >
          {/* Аватарка или иконка по умолчанию */}
          {user?.avatarUrl ? (
            <img 
                src={`https://uncramped-robbin-patrimonial.ngrok-free.dev${user.avatarUrl}`} // ИСПРАВЛЕНО: добавлен полный URL
                alt={user.name || 'User'} 
                className={styles.avatar} 
            />
          ) : (
            // Иконка по умолчанию
            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
        </button>
        
        {/* Выпадающее меню профиля */}
        {isProfileMenuOpen && (
            <div className={styles.profileDropdown}>
                
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{user.name}</span>
                    <span className={styles.userEmail}>{user.email}</span>
                </div>
                
                {/* УСЛОВНЫЙ РЕНДЕРИНГ ССЫЛКИ */}
                {user && user.isAdmin ? (
                    <Link 
                        to="/manage"
                        onClick={() => setIsProfileMenuOpen(false)} 
                        className={styles.profileLink}
                    >
                        Панель администратора
                    </Link>
                ) : (
                    <Link 
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)} 
                        className={styles.profileLink}
                    >
                        Мой профиль
                    </Link>
                )}
                
                {/* Кнопка "Выйти" */}
                <button 
                    className={`${styles.dropdownItem} ${styles.logoutButton}`}
                    onClick={handleLogout}
                >
                    Выйти
                </button>
            </div>
        )}
      </div>
    );
  }

  // Неавторизованный пользователь - показываем тумблер
  return (
    <>
      <div ref={containerRef} className={styles.wrapper}>
        <div className={`${styles.toggleContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}>
          {!isExpanded ? (
            // Свернутое состояние - только иконка
            <button className={styles.iconButton} onClick={toggleExpand}>
              <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          ) : (
            // Развернутое состояние - три кнопки
            <>
              <div className={`${styles.activeBackground} ${styles[activeState]}`} />
              <div className={styles.buttonsWrapper}>
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
            </>
          )}
        </div>
      </div>

      {/* Модальное окно уведомления об успешной регистрации */}
      {registrationSuccessName && (
          <div className={styles.notificationModal}>
              <p>Поздравляем, <strong>{registrationSuccessName}</strong>!</p>
              <p>Ваш аккаунт создан. Пожалуйста, войдите, используя свои данные.</p>
              <button onClick={() => setRegistrationSuccessName(null)}>Закрыть</button>
          </div>
      )}

      <AuthModal 
          onClose={() => setIsOpen(false)} 
          isOpen={isOpen} 
          initialMode={activeState} 
          onAuthSuccess={handleAuthSuccess}
          onRegistrationSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default IOSThreeStateToggle;