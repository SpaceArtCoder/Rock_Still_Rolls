import { Link } from 'react-router-dom';
import styles from './AdminPanel.module.scss';

/**
 * Компонент административной панели с навигационным меню.
 * Предоставляет доступ к управлению различными категориями контента.
 */
function AdminPanel() {
    return (
        <section id={styles.admin_panel_container}>
            <div className={styles.links_block}>
                <ul>
                    <li>
                        <a href='#'>Добавить</a>
                        <ul className={styles.add_sub_menu}>
                            <li>
                                <Link to="/manage?category=news">Новости</Link>
                            </li>
                            <li>
                                <Link to="/manage?category=performers">Исполнители</Link>
                            </li>
                            <li>
                                <Link to="/manage?category=events">События</Link>
                            </li>
                            <li>
                                <Link to="/manage?category=about">О проекте</Link>
                            </li>
                        </ul>
                    </li>
                    <li><Link to="/logout">Выход</Link></li>
                </ul>
            </div>
        </section>
    );
}

export default AdminPanel;
