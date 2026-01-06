// src/components/AdminRoute/AdminRoute.jsx (ИСПРАВЛЕННЫЙ)
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // ИСПРАВЛЕНИЕ #1: Показываем загрузку пока идет fetchUser()
  if (isLoading) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}>
          <div>Проверка прав доступа...</div>
        </div>
    );
  }

  // ИСПРАВЛЕНИЕ #2: Проверяем авторизацию только ПОСЛЕ загрузки
  if (!isAuthenticated || !user) {
    console.log('AdminRoute: не авторизован, редирект на главную');
    return <Navigate to="/" replace />;
  }

  // ИСПРАВЛЕНИЕ #3: Проверяем права админа
  if (!user.isAdmin) {
    console.log('AdminRoute: не админ, редирект на главную');
    return <Navigate to="/" replace />;
  }

  // ИСПРАВЛЕНИЕ #4: Логируем успешный доступ для отладки
  console.log('AdminRoute: доступ разрешен для', user.name);

  return children;
};

export default AdminRoute;