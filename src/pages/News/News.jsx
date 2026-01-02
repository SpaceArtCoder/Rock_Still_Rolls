import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './News.module.scss';

/**
 * Компонент страницы новостей
 * Отображает список новостных статей с поддержкой бесконечной прокрутки
 */
function News() {
    // Используем хук для бесконечной прокрутки новостей
    const {
        data: articles,           // Массив новостных статей
        loading,                  // Состояние загрузки данных
        error,                    // Сообщение об ошибке (если есть)
        hasMore,                  // Флаг наличия дополнительных данных для загрузки
        lastElementRef            // Ref для последнего элемента (триггер автозагрузки)
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Новости',      // Категория для фильтрации
        limit: 10                 // Количество статей для загрузки за один запрос
    });

    // Отображение индикатора загрузки при первоначальной загрузке данных
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

    // Отображение ошибки при неудачной загрузке данных
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
                {/* Отображение списка новостных статей */}
                {articles.map((article, index) => {
                    // Проверяем, является ли текущий элемент последним в списке
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.news_block}
                            ref={isLastElement ? lastElementRef : null} // Ref только для последнего элемента
                        >
                            <Link to={`/news/${article.slug}`}>
                                <img src={article.image} alt={article.title} />
                                <h2>{article.title}</h2>
                            </Link>
                            <p className={styles.scrolling_element}>{article.excerpt}</p>
                        </div>
                    );
                })}

                {/* Индикатор загрузки при подгрузке дополнительных статей */}
                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {/* Сообщение о достижении конца списка новостей */}
                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели все новости</p>
                    </div>
                )}

                {/* Сообщение при пустом списке новостей */}
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
