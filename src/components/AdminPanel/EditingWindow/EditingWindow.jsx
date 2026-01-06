import { useEffect } from 'react';
import CloseButton from '../../UI/Button/CloseButton.jsx';
import NewsArticleForm from '../NewsArticleForm/NewsArticleForm.jsx';
import styles from './EditingWindow.module.scss';

function EditingWindow({click, article, onClose, onChange}) {

    useEffect(() => {
          if (click) {
            document.body.classList.add('no_scroll');
          }
    
          else {
            document.body.classList.remove('no_scroll');
          }
    
          return () => {
            document.body.classList.remove('no_scroll');
          }
    }, [click]);

    return (
        <section className={click ? `${styles.edit_container} ${styles.show}` : styles.edit_container}>

            <CloseButton onClose={onClose}/>
            <NewsArticleForm article={article} onChange={onChange}/>
            
        </section>
    )
}

export default EditingWindow;