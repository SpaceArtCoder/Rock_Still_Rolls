import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './CookieConsent.module.scss';

/**
 * Компонент баннера согласия на использование cookies.
 * Позволяет пользователям выбирать типы cookies и сохранять свои предпочтения.
 */
const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Обязательные cookies - всегда включены
    analytics: false, // Аналитические cookies
    marketing: false, // Маркетинговые cookies
    functional: false, // Функциональные cookies
  });

  /**
   * Проверяет сохраненные настройки cookies при монтировании компонента.
   * Показывает баннер, если согласие не было дано ранее.
   */
  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  /**
   * Обрабатывает принятие всех типов cookies.
   * Сохраняет полное согласие в localStorage и инициализирует все трекеры.
   */
  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted));
    initializeTracking(allAccepted);
    setIsVisible(false);
  };

  /**
   * Обрабатывает принятие только необходимых cookies.
   * Сохраняет минимальные настройки в localStorage.
   */
  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(necessaryOnly));
    setIsVisible(false);
  };

  /**
   * Сохраняет выбранные пользователем настройки cookies.
   * Инициализирует только разрешенные трекеры.
   */
  const handleSavePreferences = () => {
    const savedPreferences = {
      ...preferences,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem('cookieConsent', JSON.stringify(savedPreferences));
    initializeTracking(savedPreferences);
    setIsVisible(false);
  };

  /**
   * Инициализирует трекеры в зависимости от предоставленного согласия.
   * @param {Object} consent - Объект с настройками согласия
   */
  const initializeTracking = (consent) => {
    // Google Analytics
    if (consent.analytics && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted'
      });
    }

    // Facebook Pixel
    if (consent.marketing && window.fbq) {
      window.fbq('consent', 'grant');
    }

    console.log('Трекинг инициализирован с настройками:', consent);
  };

  /**
   * Переключает состояние конкретного типа cookies.
   * @param {string} key - Ключ типа cookies
   */
  const handleToggle = (key) => {
    if (key === 'necessary') return; // Нельзя отключить необходимые cookies
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Затемняющий фон при открытых настройках */}
      {showSettings && (
        <div 
          className={styles.overlay} 
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Основной контейнер баннера */}
      <div className={`${styles.cookieConsent} ${showSettings ? styles.expanded : ''}`}>
        {!showSettings ? (
          // Основной баннер с краткой информацией
          <div className={styles.banner}>
            <div className={styles.content}>
              <div className={styles.icon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                  <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
                  <circle cx="8.5" cy="15" r="1" fill="currentColor"/>
                  <circle cx="15.5" cy="15" r="1" fill="currentColor"/>
                </svg>
              </div>

              <div className={styles.text}>
                <h3>Мы используем cookies</h3>
                <p>
                  Мы используем файлы cookie для улучшения работы сайта, анализа трафика и персонализации контента. 
                  Продолжая использовать сайт, вы соглашаетесь с нашей{' '}
                  <Link to="/privacy-policy" className={styles.link}>
                    Политикой конфиденциальности
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Кнопки действий основного баннера */}
            <div className={styles.actions}>
              <button 
                className={styles.settingsButton}
                onClick={() => setShowSettings(true)}
              >
                Настройки
              </button>
              <button 
                className={styles.rejectButton}
                onClick={handleAcceptNecessary}
              >
                Только необходимые
              </button>
              <button 
                className={styles.acceptButton}
                onClick={handleAcceptAll}
              >
                Принять все
              </button>
            </div>
          </div>
        ) : (
          // Расширенные настройки cookies
          <div className={styles.settings}>
            <div className={styles.settingsHeader}>
              <h3>Настройки Cookie</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setShowSettings(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Список типов cookies с переключателями */}
            <div className={styles.settingsContent}>
              {/* Необходимые cookies (обязательные) */}
              <div className={styles.cookieOption}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <h4>Необходимые cookies</h4>
                    <p>
                      Эти файлы cookie необходимы для работы сайта и не могут быть отключены. 
                      Они включают аутентификацию и безопасность.
                    </p>
                  </div>
                  <div className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={true} 
                      disabled 
                      id="necessary"
                    />
                    <label htmlFor="necessary">
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Аналитические cookies */}
              <div className={styles.cookieOption}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <h4>Аналитические cookies</h4>
                    <p>
                      Помогают нам понять, как посетители взаимодействуют с сайтом, 
                      собирая анонимную статистику (Google Analytics, Yandex.Metrica).
                    </p>
                  </div>
                  <div className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={preferences.analytics}
                      onChange={() => handleToggle('analytics')}
                      id="analytics"
                    />
                    <label htmlFor="analytics">
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Маркетинговые cookies */}
              <div className={styles.cookieOption}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <h4>Маркетинговые cookies</h4>
                    <p>
                      Используются для показа релевантной рекламы на других сайтах 
                      (Facebook Pixel, Google Ads, ретаргетинг).
                    </p>
                  </div>
                  <div className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={preferences.marketing}
                      onChange={() => handleToggle('marketing')}
                      id="marketing"
                    />
                    <label htmlFor="marketing">
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Функциональные cookies */}
              <div className={styles.cookieOption}>
                <div className={styles.optionHeader}>
                  <div className={styles.optionInfo}>
                    <h4>Функциональные cookies</h4>
                    <p>
                      Позволяют сайту запоминать ваши предпочтения (язык, регион, тему оформления).
                    </p>
                  </div>
                  <div className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={preferences.functional}
                      onChange={() => handleToggle('functional')}
                      id="functional"
                    />
                    <label htmlFor="functional">
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки действий расширенных настроек */}
            <div className={styles.settingsActions}>
              <button 
                className={styles.rejectButton}
                onClick={handleAcceptNecessary}
              >
                Только необходимые
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSavePreferences}
              >
                Сохранить настройки
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CookieConsent;
