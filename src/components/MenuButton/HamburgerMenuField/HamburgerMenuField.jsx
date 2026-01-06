import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Categories from '../../UI/Categories/Categories.jsx';
import styles from './HamburgerMenuField.module.scss';


function HamburgerMenuField({visibility}) {

    return (
        <section className={visibility ? `${styles.hamburger_menu_field_container} ${styles.show}` : styles.hamburger_menu_field_container}>
            <Categories links_direction={"show_ham_menu_links"}/>
            
        </section>
    )
}

export default HamburgerMenuField;