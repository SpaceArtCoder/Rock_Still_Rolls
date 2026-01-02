import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast/ToastContainer.jsx';

/**
 * Компонент-обертка для всех провайдеров, необходимых для тестирования
 * Обеспечивает корректную работу компонентов, зависящих от контекста
 * 
 * @param {Object} props - Свойства компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты для рендеринга
 * @returns {JSX.Element} Компонент с провайдерами
 */
const AllTheProviders = ({ children }) => {
    return (
        <MemoryRouter>
            <ToastProvider>
                {/* 
                В будущем можно добавить другие провайдеры:
                <AuthProvider>
                <ThemeProvider>
                <StoreProvider>
                */}
                {children}
            </ToastProvider>
        </MemoryRouter>
    );
};

/**
 * Кастомная функция рендеринга для тестирования
 * Обертка над стандартным render из testing-library/react
 * с предустановленными провайдерами
 * 
 * @param {React.ReactElement} ui - React компонент для рендеринга
 * @param {Object} options - Дополнительные опции для рендеринга
 * @returns {Object} Результат рендеринга testing-library
 */
const customRender = (ui, options) =>
    render(ui, { wrapper: AllTheProviders, ...options });

// Переопределяем стандартный render для удобства использования
export * from '@testing-library/react';
export { customRender as render };
