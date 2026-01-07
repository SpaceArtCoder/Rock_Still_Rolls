import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

/**
 * Компонент высшего порядка для защиты административных маршрутов.
 * @param {Object} props
 * @param {ReactNode} props.children - Компонент, доступ к которому нужно защитить.
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // 1. Состояние ожидания (предотвращает мигание редиректа при инициализации)
  if (isLoading) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          fontFamily: 'sans-serif'
        }}>
          <div>Проверка прав доступа...</div>
        </div>
    );
  }

  // 2. Проверка наличия авторизации
  if (!isAuthenticated || !user) {
    console.warn('AdminRoute: Доступ запрещен. Пользователь не авторизован.');
    return <Navigate to="/" replace />;
  }

  // 3. Проверка прав администратора
  if (!user.isAdmin) {
    console.warn(`AdminRoute: Доступ запрещен. Пользователь ${user.name} не является админом.`);
    return <Navigate to="/" replace />;
  }

  // 4. Доступ разрешен
  console.log(`AdminRoute: Доступ разрешен для администратора: ${user.name}`);

  return children;
};

export default AdminRoute;
