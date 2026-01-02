import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { useToast } from '../../components/Toast/ToastContainer';
import axios from 'axios';
import styles from './Profile.module.scss';

// Настройка axios для отправки cookies при запросах
axios.defaults.withCredentials = true;

/**
 * Компонент страницы профиля пользователя
 * Позволяет пользователям просматривать и редактировать свои данные,
 * менять пароль и управлять аккаунтом
 */
const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();

  // Состояния для управления режимами редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Данные профиля пользователя
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
  });

  // Данные для смены пароля
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Файл аватара и его превью
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Инициализация данных пользователя при загрузке компонента
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
      });
      
      // Установка превью аватара если есть URL
      if (user.avatarUrl) {
        setAvatarPreview(`http://localhost:5000${user.avatarUrl}`);
      }
    }
  }, [user]);

  /**
   * Обработчик изменения файла аватара
   * @param {Event} e - Событие выбора файла
   */
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка размера файла (максимум 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Файл слишком большой. Максимум 2MB');
        return;
      }

      setAvatarFile(file);
      
      // Создание превью изображения
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Сохранение изменений профиля пользователя
   */
  const handleSaveProfile = async () => {
    // Валидация имени
    if (!profileData.name.trim()) {
      toast.error('Имя не может быть пустым');
      return;
    }

    setIsSaving(true);

    try {
      // Создание FormData для отправки файлов
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      
      if (avatarFile) {
        formData.append('avatarFile', avatarFile);
      }

      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.user) {
        // Обновление данных пользователя в хранилище
        useAuthStore.getState().setUser(response.data.user);
        
        // Обновление превью аватара из обновленного пользователя
        if (response.data.user.avatarUrl) {
          setAvatarPreview(`http://localhost:5000${response.data.user.avatarUrl}`);
        }
        
        toast.success('Профиль успешно обновлен');
        setIsEditing(false);
        setAvatarFile(null);
      }
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      toast.error(error.response?.data?.error || 'Не удалось обновить профиль');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Смена пароля пользователя
   */
  const handleChangePassword = async () => {
    // Валидация ввода пароля
    if (!passwordData.currentPassword) {
      toast.error('Введите текущий пароль');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Новый пароль должен быть не менее 8 символов');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    setIsSaving(true);

    try {
      await axios.put(
        'http://localhost:5000/api/auth/password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }
      );

      toast.success('Пароль успешно изменен');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      toast.error(error.response?.data?.error || 'Не удалось изменить пароль');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Удаление аккаунта пользователя
   */
  const handleDeleteAccount = async () => {
    // Двойное подтверждение для защиты от случайного удаления
    if (!window.confirm(
      'Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо!'
    )) {
      return;
    }

    if (!window.confirm(
      'Все ваши данные будут удалены безвозвратно. Продолжить?'
    )) {
      return;
    }

    try {
      await axios.delete('http://localhost:5000/api/auth/account');
      
      toast.success('Аккаунт успешно удален');
      
      // Выход из системы и перенаправление на главную страницу
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Ошибка удаления аккаунта:', error);
      toast.error(error.response?.data?.error || 'Не удалось удалить аккаунт');
    }
  };

  // Если пользователь не авторизован - не рендерим компонент
  if (!user) {
    return null;
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.container}>
        {/* Заголовок страницы профиля */}
        <div className={styles.pageHeader}>
          <h1>Личный кабинет</h1>
          <p className={styles.subtitle}>Управляйте своим профилем и настройками</p>
        </div>

        <div className={styles.content}>
          {/* Левая колонка: Аватар и основная информация */}
          <div className={styles.sidebar}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt={user.name} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Кнопка загрузки нового аватара в режиме редактирования */}
              {isEditing && (
                <label className={styles.uploadButton}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Изменить фото
                </label>
              )}

              {/* Информация о пользователе */}
              <div className={styles.userInfo}>
                <h2>{user.name}</h2>
                <p className={styles.email}>{user.email}</p>
                {user.isAdmin && (
                  <span className={styles.adminBadge}>Администратор</span>
                )}
              </div>
            </div>
          </div>

          {/* Правая колонка: Формы редактирования профиля */}
          <div className={styles.mainContent}>
            {/* Карточка основной информации */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Основная информация</h3>
                {!isEditing ? (
                  <button
                    className={styles.editButton}
                    onClick={() => setIsEditing(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Редактировать
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                        });
                        setAvatarFile(null);
                        if (user.avatarUrl) {
                          setAvatarPreview(`http://localhost:5000${user.avatarUrl}`);
                        }
                      }}
                      disabled={isSaving}
                    >
                      Отмена
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.cardContent}>
                <div className={styles.formGroup}>
                  <label>Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className={styles.input}
                      placeholder="Введите ваше имя"
                    />
                  ) : (
                    <p className={styles.value}>{user.name}</p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <p className={styles.value}>{user.email}</p>
                  {isEditing && (
                    <span className={styles.hint}>Email нельзя изменить</span>
                  )}
                </div>
              </div>
            </div>

            {/* Карточка безопасности */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Безопасность</h3>
              </div>

              <div className={styles.cardContent}>
                {!isChangingPassword ? (
                  <button
                    className={styles.secondaryButton}
                    onClick={() => setIsChangingPassword(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Изменить пароль
                  </button>
                ) : (
                  <div className={styles.passwordForm}>
                    <div className={styles.formGroup}>
                      <label>Текущий пароль</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={styles.input}
                        placeholder="Введите текущий пароль"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Новый пароль</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className={styles.input}
                        placeholder="Минимум 8 символов"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Подтвердите новый пароль</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={styles.input}
                        placeholder="Повторите новый пароль"
                      />
                    </div>

                    <div className={styles.editActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        disabled={isSaving}
                      >
                        Отмена
                      </button>
                      <button
                        className={styles.saveButton}
                        onClick={handleChangePassword}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Изменение...' : 'Изменить пароль'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Карточка "Опасная зона" для удаления аккаунта */}
            <div className={`${styles.card} ${styles.dangerZone}`}>
              <div className={styles.cardHeader}>
                <h3>Опасная зона</h3>
              </div>

              <div className={styles.cardContent}>
                <p className={styles.dangerText}>
                  Удаление аккаунта — необратимое действие. Все ваши данные, комментарии и настройки будут удалены безвозвратно.
                </p>

                <button
                  className={styles.dangerButton}
                  onClick={handleDeleteAccount}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Удалить аккаунт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
