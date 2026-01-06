import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Categories from '@/components/Categories/Categories';
import styles from './HamburgerMenuField.module.scss';

interface HamburgerMenuField {
    visibility: boolean,
}

function HamburgerMenuField({visibility} : HamburgerMenuField) {
    // const [isOpen, setIsOpen] = useState(visibility);
    // const location = useLocation();

    // useEffect(() => {
    //     setIsOpen(visibility);
    // }, [visibility]);

    // useEffect(() => {
    //     if (isOpen) {
    //         setIsOpen(false);
    //     }
    // }, [location]);

    return (
        <section className={visibility ? `${styles.hamburger_menu_field_container} ${styles.show}` : styles.hamburger_menu_field_container}>
            <Categories links_direction={"show_ham_menu_links"}/>
            
        </section>
    )
}

export default HamburgerMenuField;