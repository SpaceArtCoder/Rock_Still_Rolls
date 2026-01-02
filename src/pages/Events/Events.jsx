import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Events.module.scss';

/**
 * Компонент страницы событий (Events)
 * Отображает список событий с поддержкой бесконечной прокрутки
 */
function Events() {
    // Используем хук для бесконечной прокрутки событий
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

    // Отображение состояния загрузки при первоначальной загрузке
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

    // Отображение ошибки загрузки данных
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
                {/* Отображение списка событий */}
                {articles.map((article, index) => {
                    // Для последнего элемента добавляем ref для триггера бесконечной прокрутки
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.events_block}
                            ref={isLastElement ? lastElementRef : null}
                        >
                            <Link to={`/events/${article.slug}`}>
                                <img src={article.image} alt={article.title} />
                                <h2>{article.title}</h2>
                            </Link>
                            <p className={styles.scrolling_element}>{article.excerpt}</p>
                        </div>
                    );
                })}

                {/* Индикатор загрузки при подгрузке дополнительных событий */}
                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {/* Сообщение о достижении конца списка */}
                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели все события</p>
                    </div>
                )}

                {/* Состояние пустого списка событий */}
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
