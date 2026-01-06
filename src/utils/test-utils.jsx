/* eslint-disable react-refresh/only-export-components */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast/ToastContainer.jsx';
// Импортируйте другие провайдеры здесь

const AllTheProviders = ({ children }) => {
    return (
        <MemoryRouter>
            <ToastProvider>
                {/* <AuthProvider> */}
                {children}
                {/* </AuthProvider> */}
            </ToastProvider>
        </MemoryRouter>
    );
};

const customRender = (ui, options) =>
    render(ui, { wrapper: AllTheProviders, ...options });

// Переопределяем стандартный render
export * from '@testing-library/react';
export { customRender as render };