// src/components/ProtectedRoute/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

/**
 * Компонент для защиты маршрутов
 * Пропускает только авторизованных пользователей
 * Администраторы имеют доступ ко всем защищенным маршрутам
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        fontSize: '18px',
        color: '#64748b'
      }}>
        Загрузка...
      </div>
    );
  }

  // Если не авторизован - редирект на главную
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Если требуется админ, но пользователь не админ - редирект
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Всё в порядке - показываем контент
  return children;
};

export default ProtectedRoute;