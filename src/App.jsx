import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import Footer from './components/Footer/Footer.jsx';
import AdminRoute from './components/AdminRoute/AdminRoute.jsx';
import { ToastProvider, useToast } from './components/Toast/ToastContainer';
import CookieConsent from './components/CookieConsent/CookieConsent';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner.jsx';
import './assets/styles/main.scss';

// Lazy loading для страниц - загрузка компонентов только при необходимости
const MainContent = lazy(() => import('./pages/MainContent/MainContent.jsx'));
const News = lazy(() => import('./pages/News/News.jsx'));
const Performers = lazy(() => import('./pages/Performers/Performers.jsx'));
const Events = lazy(() => import('./pages/Events/Events.jsx'));
const About = lazy(() => import('./pages/About/About.jsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy.jsx'));
const ManageContent = lazy(() => import('./components/AdminPanel/ManageContent/ManageContent.jsx'));
const ArticlePage = lazy(() => import('./components/UI/ArticlePage/ArticlePage.jsx'));

/**
 * Компонент-обработчик OAuth авторизации
 * Обрабатывает редиректы от OAuth провайдеров (GitHub, Google и т.д.)
 * Парсит URL параметры для определения статуса аутентификации
 */
function OAuthHandler() {
    const fetchUser = useAuthStore(state => state.fetchUser);
    const toast = useToast();

    useEffect(() => {
        // Парсинг URL параметров для обработки OAuth редиректов
        const params = new URLSearchParams(window.location.search);
        const authStatus = params.get('auth');
        const error = params.get('error');

        // Обработка успешной аутентификации
        if (authStatus === 'success') {
            toast.success('Вход выполнен успешно!');
            fetchUser(); // Загрузка данных пользователя после успешного входа
            // Очистка URL от параметров авторизации
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Обработка ошибок аутентификации
        if (error) {
            let errorMessage = 'Ошибка входа';

            // Определение типа ошибки для пользовательского сообщения
            if (error === 'oauth_failed') {
                errorMessage = 'Не удалось войти через социальную сеть';
            } else if (error === 'no_email') {
                errorMessage = 'Не удалось получить email из GitHub';
            }

            toast.error(errorMessage);
            // Очистка URL от параметров ошибок
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [fetchUser, toast]);

    return null; // Компонент не рендерит UI, только обрабатывает логику
}

/**
 * Главный компонент приложения App
 * Содержит:
 * - Маршрутизацию между страницами
 * - Инициализацию аутентификации
 * - Глобальные провайдеры (Toast, Cookie Consent)
 * - Основную структуру приложения (Header, Main, Footer)
 */
function App() {
    // Получение методов из хранилища аутентификации
    const fetchUser = useAuthStore(state => state.fetchUser);
    const initAuthSync = useAuthStore(state => state.initAuthSync); // Синхронизация между вкладками

    useEffect(() => {
        // Инициализация приложения при монтировании
        fetchUser(); // Загрузка данных текущего пользователя
        const cleanup = initAuthSync(); // Инициализация синхронизации между вкладками

        // Функция очистки при размонтировании компонента
        return () => {
            if (cleanup) cleanup();
        };
    }, [fetchUser, initAuthSync]);

    return (
        // Глобальный провайдер для уведомлений (Toast)
        <ToastProvider>
            {/* Обработчик OAuth редиректов */}
            <OAuthHandler />
            
            {/* Основной контейнер приложения */}
            <div className="App">
                {/* Шапка приложения (навигация, поиск, авторизация) */}
                <Header />
                
                {/* Основное содержимое страницы */}
                <main className="main-content-block">
                    {/* Suspense для ленивой загрузки страниц с индикатором загрузки */}
                    <Suspense fallback={<LoadingSpinner />}>
                        {/* Маршрутизация приложения */}
                        <Routes>
                            {/* Публичные маршруты */}
                            <Route path="/" element={<MainContent />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/news/:slug" element={<ArticlePage />} />
                            <Route path="/performers" element={<Performers />} />
                            <Route path="/performers/:slug" element={<ArticlePage />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:slug" element={<ArticlePage />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                            {/* Маршрут 404 - страница не найдена */}
                            <Route path="*" element={<h2>404 - Страница не найдена</h2>} />

                            {/* Защищенные маршруты (только для авторизованных пользователей) */}
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Административные маршруты (только для администраторов) */}
                            <Route
                                path="/manage"
                                element={
                                    <AdminRoute>
                                        <ManageContent />
                                    </AdminRoute>
                                }
                            />
                            <Route
                                path="/manage/:slug"
                                element={
                                    <AdminRoute>
                                        <ArticlePage />
                                    </AdminRoute>
                                }
                            />
                        </Routes>
                    </Suspense>
                </main>

                {/* Подвал приложения */}
                <Footer />
                
                {/* Компонент согласия на использование cookies */}
                <CookieConsent />
            </div>
        </ToastProvider>
    );
}

export default App;
