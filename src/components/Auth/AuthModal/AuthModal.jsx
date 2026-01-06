// src/components/AuthModal/AuthModal.jsx (С РАБОЧИМИ OAUTH КНОПКАМИ)
import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../../store/useAuthStore';
import { useToast } from '../../Toast/ToastContainer';
import ForgotPasswordModal from './ForgotPasswordModal';
import styles from './AuthModal.module.scss';

const AuthModal = ({ isOpen, onClose, initialMode, onAuthSuccess, onRegistrationSuccess }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const registeredEmail = useRef('');

  const login = useAuthStore(state => state.login);
  const register = useAuthStore(state => state.register);
  const toast = useToast();

  // Все useEffect остаются без изменений...
  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode === 'register' ? 'register' : 'login');
    const emailToUse = registeredEmail.current || '';
    setFormData({
      name: '',
      email: emailToUse,
      password: '',
      confirmPassword: ''
    });
    setAvatarFile(null);
    setErrors({});
    if (emailToUse) {
      setTimeout(() => {
        registeredEmail.current = '';
      }, 500);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
        general: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatarFile: 'Файл слишком большой (макс. 2MB).' }));
      setAvatarFile(null);
    } else {
      setAvatarFile(file);
      setErrors(prev => ({ ...prev, avatarFile: null }));
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateName = (name) => {
    return name.trim().length >= 2;
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === 'register' && !validateName(formData.name)) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Введите корректный email';
    }

    if (!validatePassword(formData.password)) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (mode === 'register' && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      if (mode === 'register') {
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        submitData.append('confirmPassword', formData.confirmPassword);

        if (avatarFile) {
          submitData.append('avatarFile', avatarFile);
        }

        const result = await register(submitData);

        if (result.success) {
          toast.success(`Добро пожаловать, ${result.user.name}! Теперь войдите в систему.`, 5000);
          registeredEmail.current = result.user.email;

          if (onRegistrationSuccess) {
            onRegistrationSuccess(result.user.name);
          }

          setMode('login');
          setFormData({
            name: '',
            email: result.user.email,
            password: '',
            confirmPassword: ''
          });
          setAvatarFile(null);
          setErrors({});

        } else {
          if (result.errors.general) {
            toast.error(result.errors.general);
          } else if (result.errors.email) {
            toast.error(result.errors.email);
          } else {
            toast.error('Ошибка регистрации. Проверьте введенные данные.');
          }
          setErrors(result.errors);
        }

      } else {
        const result = await login(formData.email, formData.password);

        if (result.success) {
          toast.success(`С возвращением, ${result.user.name}!`, 3000);

          if (onAuthSuccess) {
            onAuthSuccess(result.user);
          }

          onClose();

        } else {
          if (result.errors.general) {
            toast.error(result.errors.general);
          } else {
            toast.error('Неверный email или пароль. Попробуйте снова.');
          }
          setErrors(result.errors);
        }
      }

    } catch (error) {
      console.error('Неожиданная ошибка:', error);
      toast.error('Произошла неожиданная ошибка. Попробуйте позже.');
      setErrors({ general: 'Произошла неожиданная ошибка. Попробуйте снова.' });

    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    const newMode = mode === 'login' ? 'register' : 'login';
    setMode(newMode);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setAvatarFile(null);
    setErrors({});
    registeredEmail.current = '';
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setIsForgotPasswordOpen(true);
  };

  // НОВОЕ: Обработчики OAuth
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/oauth/google';
  };

  const handleGithubLogin = () => {
    window.location.href = 'http://localhost:5000/api/oauth/github';
  };

  if (!isOpen) return null;

  return (
      <>
        <div className={styles.overlay} onClick={onClose}>
          <div
              className={`${styles.modal} ${isOpen ? styles.modalOpen : ''}`}
              onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.closeButton} onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={styles.header}>
              <h2 className={styles.title}>
                {mode === 'login' ? 'Вход в аккаунт' : 'Создать аккаунт'}
              </h2>
              <p className={styles.subtitle}>
                {mode === 'login'
                    ? 'Добро пожаловать! Войдите, чтобы продолжить'
                    : 'Заполните данные для регистрации'}
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              {mode === 'register' && (
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Имя</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                        placeholder="Введите ваше имя"
                        disabled={isSubmitting}
                    />
                    {errors.name && <span className={styles.error}>{errors.name}</span>}
                  </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Пароль</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                />
                {errors.password && <span className={styles.error}>{errors.password}</span>}
              </div>

              {mode === 'register' && (
                  <>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Подтвердите пароль</label>
                      <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                      />
                      {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>

                    <div className={styles.fileInputWrapper}>
                      <label htmlFor="avatar-upload" className={styles.fileLabel}>
                        {avatarFile ? `Выбран: ${avatarFile.name}` : 'Выберите аватар (необязательно, макс 2MB)'}
                      </label>
                      <input
                          id="avatar-upload"
                          type="file"
                          name="avatarFile"
                          accept="image/*"
                          onChange={handleFileChange}
                          className={styles.hiddenInput}
                          disabled={isSubmitting}
                      />
                    </div>
                    {errors.avatarFile && <p className={styles.errorText}>{errors.avatarFile}</p>}
                  </>
              )}

              {mode === 'login' && (
                  <div className={styles.forgotPassword}>
                    <a href="#" onClick={handleForgotPassword} className={styles.link}>
                      Забыли пароль?
                    </a>
                  </div>
              )}

              <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
              >
                {isSubmitting ? (
                    <span className={styles.spinner}></span>
                ) : (
                    mode === 'login' ? 'Войти' : 'Зарегистрироваться'
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                {mode === 'login' ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                {' '}
                <button
                    type="button"
                    onClick={switchMode}
                    className={styles.switchButton}
                    disabled={isSubmitting}
                >
                  {mode === 'login' ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>

            <div className={styles.divider}>
              <span className={styles.dividerText}>или</span>
            </div>

            {/* ОБНОВЛЕНО: Рабочие кнопки OAuth */}
            <div className={styles.socialButtons}>
              <button
                  type="button"
                  className={styles.socialButton}
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button
                  type="button"
                  className={styles.socialButton}
                  onClick={handleGithubLogin}
                  disabled={isSubmitting}
              >
                <svg className={styles.socialIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>
            </div>
          </div>
        </div>

        <ForgotPasswordModal
            isOpen={isForgotPasswordOpen}
            onClose={() => setIsForgotPasswordOpen(false)}
            onSuccess={() => {
              toast.success('Новый пароль отправлен на ваш email!');
            }}
        />
      </>
  );
};

export default AuthModal;