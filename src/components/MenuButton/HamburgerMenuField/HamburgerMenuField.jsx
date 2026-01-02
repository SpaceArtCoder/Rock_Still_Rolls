import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Categories from '../../UI/Categories/Categories.jsx';
import styles from './HamburgerMenuField.module.scss';

/**
 * Компонент выпадающего гамбургер-меню.
 * Отображает категории навигации в мобильной версии сайта.
 */
function HamburgerMenuField({ visibility }) {
    return (
        <section className={visibility ? `${styles.hamburger_menu_field_container} ${styles.show}` : styles.hamburger_menu_field_container}>
            {/* Компонент категорий с мобильными стилями */}
            <Categories links_direction={"show_ham_menu_links"}/>
        </section>
    );
}

export default HamburgerMenuField;
