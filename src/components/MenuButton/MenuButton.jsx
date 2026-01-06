import { useState } from 'react';
import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import HamburgerMenuField from './HamburgerMenuField/HamburgerMenuField.jsx';
import styles from './MenuButton.module.scss';

function AnimatedMenuButton({isOpen, openMenu}) {
  const location = useLocation();
  
    useEffect(() => {
      if (isOpen) {
        document.body.classList.add('no_scroll');
      }

      else {
        document.body.classList.remove('no_scroll');
      }

      return () => {
        document.body.classList.remove('no_scroll');
      }
    }, [isOpen]);


    useEffect(() => {
        if (isOpen) {
            openMenu(false); //Close the hamburger-menu when clicking on any of its links
        }
    }, [location]); 



  return (
    <>
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

      <HamburgerMenuField visibility={isOpen}/>
    </>
  );
};


function MenuButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AnimatedMenuButton isOpen={isOpen} openMenu={() => setIsOpen(!isOpen)} />
      
  );
}

export default MenuButton;