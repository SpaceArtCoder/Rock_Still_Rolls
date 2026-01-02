import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Categories from '@/components/Categories/Categories';
import styles from './HamburgerMenuField.module.scss';

/**
 * Компонент выпадающего меню (гамбургер-меню).
 * Отображает категории в мобильной версии навигации.
 */
function HamburgerMenuField({ visibility }) {
    const pathname = usePathname();

    return (
        <section className={visibility ? `${styles.hamburger_menu_field_container} ${styles.show}` : styles.hamburger_menu_field_container}>
            {/* Компонент категорий для гамбургер-меню */}
            <Categories links_direction={"show_ham_menu_links"}/>
        </section>
    );
}

export default HamburgerMenuField;
