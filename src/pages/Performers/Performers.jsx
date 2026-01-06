// Performers.jsx - УЛУЧШЕННАЯ ВЕРСИЯ С LAZY LOADING ИЗОБРАЖЕНИЙ

import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Performers.module.scss';

function Performers() {
    const {
        data: articles,
        loading,
        error,
        hasMore,
        lastElementRef
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Исполнители',
        limit: 15
    });

    if (loading && articles.length === 0) {
        return (
            <section className={styles.performers_page}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                    <p>Загрузка исполнителей...</p>
                </div>
            </section>
        );
    }

    if (error && articles.length === 0) {
        return (
            <section className={styles.performers_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.performers_page}>
            <div className={styles.performers_page_block}>
                {articles.map((article, index) => {
                    if (index === articles.length - 1) {
                        return (
                            <div
                                key={article.id}
                                className={styles.performers_block}
                                ref={lastElementRef}
                            >
                                <Link to={`/performers/${article.slug}`}>
                                    {/* ДОБАВЛЕНО: loading="lazy" для отложенной загрузки */}
                                    <img
                                        src={article.image}
                                        alt={article.title}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <h2>{article.title}</h2>
                                </Link>
                            </div>
                        );
                    }

                    return (
                        <div key={article.id} className={styles.performers_block}>
                            <Link to={`/performers/${article.slug}`}>
                                {/* ДОБАВЛЕНО: loading="lazy" для отложенной загрузки */}
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <h2>{article.title}</h2>
                            </Link>
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
                        <p>Вы просмотрели всех исполнителей</p>
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Нет доступных исполнителей</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default Performers;