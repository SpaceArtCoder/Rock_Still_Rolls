// Events.jsx - УЛУЧШЕННАЯ ВЕРСИЯ С LAZY LOADING ИЗОБРАЖЕНИЙ

import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Events.module.scss';

function Events() {
    const {
        data: articles,
        loading,
        error,
        hasMore,
        lastElementRef
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'События',
        limit: 10
    });

    if (loading && articles.length === 0) {
        return (
            <section className={styles.events_page}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                    <p>Загрузка событий...</p>
                </div>
            </section>
        );
    }

    if (error && articles.length === 0) {
        return (
            <section className={styles.events_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.events_page}>
            <div className={styles.events_page_block}>
                {articles.map((article, index) => {
                    if (index === articles.length - 1) {
                        return (
                            <div
                                key={article.id}
                                className={styles.events_block}
                                ref={lastElementRef}
                            >
                                <Link to={`/events/${article.slug}`}>
                                    {/* ДОБАВЛЕНО: loading="lazy" для отложенной загрузки */}
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <h2>{article.title}</h2>
                                </Link>
                                <p className={styles.scrolling_element}>{article.excerpt}</p>
                            </div>
                        );
                    }

                    return (
                        <div key={article.id} className={styles.events_block}>
                            <Link to={`/events/${article.slug}`}>
                                {/* ДОБАВЛЕНО: loading="lazy" для отложенной загрузки */}
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <h2>{article.title}</h2>
                            </Link>
                            <p className={styles.scrolling_element}>{article.excerpt}</p>
                        </div>
                    );
                })}

                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели все события</p>
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Нет доступных событий</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default Events;