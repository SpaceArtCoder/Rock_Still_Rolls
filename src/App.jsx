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

// Lazy loading для страниц
const MainContent = lazy(() => import('./pages/MainContent/MainContent.jsx'));
const News = lazy(() => import('./pages/News/News.jsx'));
const Performers = lazy(() => import('./pages/Performers/Performers.jsx'));
const Events = lazy(() => import('./pages/Events/Events.jsx'));
const About = lazy(() => import('./pages/About/About.jsx'));
const Profile = lazy(() => import('./pages/Profile/Profile.jsx'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy/PrivacyPolicy.jsx'));
const ManageContent = lazy(() => import('./components/AdminPanel/ManageContent/ManageContent.jsx'));
const ArticlePage = lazy(() => import('./components/UI/ArticlePage/ArticlePage.jsx'));

// НОВЫЙ КОМПОНЕНТ: Обработчик OAuth
function OAuthHandler() {
    const fetchUser = useAuthStore(state => state.fetchUser);
    const toast = useToast();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const authStatus = params.get('auth');
        const error = params.get('error');

        if (authStatus === 'success') {
            toast.success('Вход выполнен успешно!');
            fetchUser();
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (error) {
            let errorMessage = 'Ошибка входа';

            if (error === 'oauth_failed') {
                errorMessage = 'Не удалось войти через социальную сеть';
            } else if (error === 'no_email') {
                errorMessage = 'Не удалось получить email из GitHub';
            }

            toast.error(errorMessage);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [fetchUser, toast]);

    return null;
}

function App() {
    const fetchUser = useAuthStore(state => state.fetchUser);
    const initAuthSync = useAuthStore(state => state.initAuthSync); // НОВОЕ

    useEffect(() => {
        // Загружаем данные пользователя
        fetchUser();

        // НОВОЕ: Инициализируем синхронизацию между вкладками
        const cleanup = initAuthSync();

        // Очистка при размонтировании
        return () => {
            if (cleanup) cleanup();
        };
    }, [fetchUser, initAuthSync]); // ОБНОВЛЕНО: Добавлен initAuthSync в зависимости



    return (
        <ToastProvider>
            <OAuthHandler />
            <div className="App">
                <Header />
                <main className="main-content-block">
                    <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                            <Route path="/" element={<MainContent />} />
                            <Route path="/news" element={<News />} />
                            <Route path="/news/:slug" element={<ArticlePage />} />
                            <Route path="/performers" element={<Performers />} />
                            <Route path="/performers/:slug" element={<ArticlePage />} />
                            <Route path="/events" element={<Events />} />
                            <Route path="/events/:slug" element={<ArticlePage />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

                            <Route path="*" element={<h2>404 - Страница не найдена</h2>} />

                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

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

                <Footer />
                <CookieConsent />
            </div>
        </ToastProvider>
    );
}

export default App;