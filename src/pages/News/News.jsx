// News.jsx - УЛУЧШЕННАЯ ВЕРСИЯ С LAZY LOADING ИЗОБРАЖЕНИЙ

import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './News.module.scss';

function News() {
    const {
        data: articles,
        loading,
        error,
        hasMore,
        lastElementRef
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Новости',
        limit: 10
    });

    if (loading && articles.length === 0) {
        return (
            <section className={styles.news_page}>
                <div className={styles.loader}>
                    <div className={styles.spinner}></div>
                    <p>Загрузка новостей...</p>
                </div>
            </section>
        );
    }

    if (error && articles.length === 0) {
        return (
            <section className={styles.news_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.news_page}>
            <div className={styles.news_page_block}>
                {articles.map((article, index) => {
                    if (index === articles.length - 1) {
                        return (
                            <div
                                key={article.id}
                                className={styles.news_block}
                                ref={lastElementRef}
                            >
                                <Link to={`/news/${article.slug}`}>
                                    {/* ДОБАВЛЕНО: loading="lazy" и декодирование для качества */}
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
                        <div key={article.id} className={styles.news_block}>
                            <Link to={`/news/${article.slug}`}>
                                {/* ДОБАВЛЕНО: loading="lazy" и декодирование для качества */}
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
                        <p>Вы просмотрели все новости</p>
                    </div>
                )}

                {!loading && articles.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Нет доступных новостей</p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default News;