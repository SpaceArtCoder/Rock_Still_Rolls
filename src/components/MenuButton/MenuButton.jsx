import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HamburgerMenuField from './HamburgerMenuField/HamburgerMenuField.jsx';
import styles from './MenuButton.module.scss';

/**
 * Анимированная кнопка гамбургер-меню.
 * Управляет открытием/закрытием мобильного меню и блокировкой прокрутки страницы.
 */
function AnimatedMenuButton({ isOpen, openMenu }) {
  const location = useLocation();

  /**
   * Эффект для управления классом блокировки прокрутки страницы.
   */
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('no_scroll');
    } else {
      document.body.classList.remove('no_scroll');
    }

    return () => {
      document.body.classList.remove('no_scroll');
    };
  }, [isOpen]);

  /**
   * Эффект для закрытия меню при изменении маршрута.
   */
  useEffect(() => {
    if (isOpen) {
      openMenu(false);
    }
  }, [location]);

  return (
    <>
      {/* Кнопка гамбургер-меню с SVG-анимацией */}
      <button
        onClick={openMenu}
        className={isOpen ? styles.menu_toggle_open : styles.menu_toggle}
        aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect className={styles.line_top} x="6" y="8" width="20" height="2.5" rx="1.25" fill="currentColor"/>
          <rect className={styles.line_middle} x="6" y="14.75" width="20" height="2.5" rx="1.25" fill="currentColor"/>
          <rect className={styles.line_bottom} x="6" y="21.5" width="20" height="2.5" rx="1.25" fill="currentColor"/>
        </svg>
      </button>

      {/* Выпадающее меню */}
      <HamburgerMenuField visibility={isOpen}/>
    </>
  );
}

/**
 * Основной компонент кнопки меню.
 * Управляет состоянием открытия/закрытия меню.
 */
function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AnimatedMenuButton isOpen={isOpen} openMenu={() => setIsOpen(!isOpen)} />
  );
}

export default MenuButton;
