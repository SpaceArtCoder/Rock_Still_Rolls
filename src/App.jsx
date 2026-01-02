/**
 * КОРНЕВОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ (App.jsx)
 * --------------------------------------
 * Назначение: 
 * - Настройка маршрутизации (React Router).
 * - Управление глобальным состоянием сессии (Zustand).
 * - Обработка результатов OAuth-авторизации.
 * - Синхронизация состояния между вкладками браузера.
 */

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import MainContent from './pages/MainContent/MainContent.jsx';
import News from './pages/News/News.jsx';
import Performers from './pages/Permormers/Performers.jsx';
import Events from './pages/Events/Events.jsx';
import About from './pages/About/About.jsx';
import Footer from './components/Footer/Footer.jsx';
import ManageContent from './components/AdminPanel/ManageContent/ManageContent.jsx';
import ArticlePage from './components/UI/ArticlePage/ArticlePage.jsx';
import AdminRoute from './components/AdminRoute/AdminRoute.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy.jsx';
import { ToastProvider, useToast } from './components/Toast/ToastContainer';
import CookieConsent from './components/CookieConsent/CookieConsent';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import './assets/styles/main.scss';
import Profile from './pages/Profile/Profile.jsx';

/**
 * КОМПОНЕНТ: OAuthHandler
 * -----------------------
 * Назначение: Перехват параметров из URL после редиректа от Google/GitHub.
 * Если в URL есть ?auth=success, обновляет данные пользователя в приложении.
 */

function OAuthHandler() {
    const fetchUser = useAuthStore(state => state.fetchUser);
    const toast = useToast();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const authStatus = params.get('auth');
        const error = params.get('error');

        if (authStatus === 'success') {
            fetchUser(); // Запрашиваем данные профиля у сервера
            toast('Вы успешно вошли через соцсети!', 'success');
            // Очищаем URL от сервисных параметров
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (error) {
            toast('Ошибка при входе через соцсети', 'error');
        }
    }, [fetchUser, toast]);

    return null; // Компонент ничего не рендерит, только выполняет логику
}

function App() {
  const { fetchUser, logout } = useAuthStore();

  /**
   * ЭФФЕКТ: Инициализация и Синхронизация
   * 1. При загрузке проверяет сессию пользователя.
   * 2. Слушает событие 'storage', чтобы мгновенно разлогинить юзера 
   * во всех вкладках, если он вышел в одной из них.
   */
  useEffect(() => {
    fetchUser(); // Проверка Cookie при старте

    const handleStorageChange = (e) => {
      if (e.key === 'auth-storage' && !e.newValue) {
        logout(); // Синхронный выход
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUser, logout]);

  return (
      <ToastProvider>
        <div className="app-container">
          <Header />
          <OAuthHandler /> {/* Слушатель OAuth событий */}

          <main className="main-content">
            <Routes>
              {/* --- ПУБЛИЧНЫЕ МАРШРУТЫ --- */}
              <Route path="/" element={<MainContent />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<ArticlePage />} />
              <Route path="/about" element={<About />} />

              {/* --- ПРИВАТНЫЕ МАРШРУТЫ (Для залогиненных) --- */}
              <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
              />

              {/* --- АДМИН ПАНЕЛЬ (Только для isAdmin) --- */}
              
              <Route
                  path="/manage"
                  element={
                    <AdminRoute>
                      <ManageContent />
                    </AdminRoute>
                  }
              />
              
              {/* Обработка несуществующих страниц */}
              <Route path="*" element={<h2>404 - Страница не найдена</h2>} />
            </Routes>
          </main>

          <Footer />
          <CookieConsent /> {/* Уведомление об использовании Cookie */}
        </div>
      </ToastProvider>
  );
}

export default App;
