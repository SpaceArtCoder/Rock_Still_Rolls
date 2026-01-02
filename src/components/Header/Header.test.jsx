import { render, screen } from '../../utils/test-utils'; // используем наш крутой помощник
import userEvent from '@testing-library/user-event';
import Header from './Header';

describe('Взаимодействие с мобильным меню', () => {
    it('должно открывать и закрывать мобильное меню при клике', async () => {
        const user = userEvent.setup();
        render(<Header />);

        // 1. Находим кнопку (после клика текст меняется на "Закрыть меню", судя по логу)
        const menuButton = screen.getByRole('button', { name: /открыть меню/i });

        // 2. Кликаем
        await user.click(menuButton);

        // 3. Вместо простого getByRole, ищем навигацию, которая находится
        // внутри блока с классом мобильного меню.
        // Или используем getAll и берем первый (мобильный обычно идет первым в DOM)
        const navElements = screen.getAllByRole('navigation', { hidden: true });
        const mobileNav = navElements[0];

        // 4. Проверяем наличие класса открытия
        expect(mobileNav).toHaveClass('_show_ham_menu_links_c9e080');

        // 5. Проверяем, что кнопка сменила label (как видно в вашем логе ошибки)
        expect(screen.getByLabelText(/закрыть меню/i)).toBeInTheDocument();

        // 6. Закрываем обратно
        await user.click(screen.getByLabelText(/закрыть меню/i));
        expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    });
})