import React from 'react';
import styles from './About.module.scss';

/**
 * Страница "О проекте" для музыкального веб-приложения
 * Описывает цели, ценности и функциональность платформы для любителей рок-музыки
 */
const AboutPage = () => {
    return (
        <div className={styles.container}>
            {/* Хедер страницы с основным заголовком и слоганом */}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    ROCK STILL <span className={styles.highlight}>ROLLS</span>
                </h1>
                <p className={styles.subtitle}>
                    Музыкальное пространство для тех, кто слышит драйв в каждом аккорде.
                </p>
            </header>

            {/* Основной контент страницы */}
            <section className={styles.content}>
                {/* Блок с описанием проекта */}
                <div className={styles.main_text}>
                    <h2>О проекте</h2>
                    <p>
                        <span className={styles.highlight}>Rock Still Rolls</span> — это не просто агрегатор новостей.
                        Это манифест вечной классики и площадка для продвижения новой волны рок-музыки.
                        Мы верим, что рок-н-ролл не умер, он просто стал громче.
                    </p>
                </div>

                {/* Сетка карточек с ключевыми функциями платформы */}
                <div className={styles.grid}>
                    {/* Карточка 1: Обзоры музыкального контента */}
                    <div className={styles.card}>
                        <div className={styles.card_icon}>🎸</div>
                        <h3>Обзоры</h3>
                        <p>
                            Глубокий анализ альбомов, интервью с группами и отчеты 
                            с самых жарких концертов.
                        </p>
                    </div>

                    {/* Карточка 2: Сообщество пользователей */}
                    <div className={styles.card}>
                        <div className={styles.card_icon}>⚡</div>
                        <h3>Комьюнити</h3>
                        <p>
                            Живое общение, система комментариев и возможность 
                            влиять на контент через голосование.
                        </p>
                    </div>

                    {/* Карточка 3: Культура и философия рока */}
                    <div className={styles.card}>
                        <div className={styles.card_icon}>🔥</div>
                        <h3>Драйв</h3>
                        <p>
                            Только проверенные факты и авторский взгляд 
                            на историю развития тяжелой музыки.
                        </p>
                    </div>
                </div>
            </section>

            {/* Футер страницы с призывом к действию */}
            <footer className={styles.footer}>
                <p>Присоединяйся к нам. Громкость на максимум.</p>
                <div className={styles.divider}></div>
            </footer>
        </div>
    );
};

export default AboutPage;
