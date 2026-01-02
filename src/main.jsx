/**
 * ТОЧКА ВХОДА (main.jsx)
 * ---------------------
 * Назначение: Инициализация React-приложения, подключение глобальных стилей
 * и настройка окружения для работы маршрутизации.
 */

import { StrictMode } from 'react'
import { BrowserRouter as Router } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

// Глобальные стили (сброс настроек, шрифты, базовые переменные)
import './assets/styles/base/_base.scss';

// Корневой компонент приложения
import App from './App.jsx';

/**
 * Рендеринг приложения в DOM-элемент с id='root'
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter (Router): 
        Оборачивает приложение для работы навигации без перезагрузки страницы (SPA). 
    */}
    <Router>
      <App />
    </Router>
  </StrictMode>
)
