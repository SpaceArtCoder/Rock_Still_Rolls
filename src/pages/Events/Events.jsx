import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Events.module.scss';

/**
 * Компонент страницы "События" с отображением статей категории "События"
 * Особенности:
 * - Бесконечная прокрутка (infinite scroll) через кастомный хук
 * - Ленивая загрузка изображений (lazy loading)
 * - Обработка состояний загрузки, ошибок и пустого списка
 */
function Events() {
    // Использование кастомного хука для бесконечной прокрутки
    // Хук получает статьи из API с фильтрацией по категории "События"
    const {
        data: articles,
        loading,
        error,
        hasMore,
        lastElementRef
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'События', // Фильтрация по категории
        limit: 10 // Количество статей на одну загрузку
    });

    // Состояние: начальная загрузка (когда список статей пуст)
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

    // Состояние: ошибка загрузки (когда список статей пуст)
    if (error && articles.length === 0) {
        return (
            <section className={styles.events_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    // Основной рендеринг списка событий
    return (
        <section className={styles.events_page}>
            <div className={styles.events_page_block}>
                {articles.map((article, index) => {
                    // Определение последнего элемента для привязки рефа бесконечной прокрутки
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.events_block}
                            // Реф прикрепляется только к последнему элементу для триггера загрузки
                            ref={isLastElement ? lastElementRef : null}
                        >
                            {/* Ссылка на детальную страницу события */}
                            <Link to={`/events/${article.slug}`}>
                                {/* Изображение события с ленивой загрузкой */}
                                <img
                                    src={article.image}
                                    alt={article.title}
                                    loading="lazy" // Ленивая загрузка изображений
                                    decoding="async" // Асинхронное декодирование для оптимизации
                                />
                                <h2>{article.title}</h2>
                            </Link>
                            {/* Краткое описание события */}
                            <p className={styles.scrolling_element}>{article.excerpt}</p>
                        </div>
                    );
                })}

                {/* Индикатор загрузки дополнительных данных (когда список уже не пуст) */}
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

                {/* Состояние: пустой список событий (после успешной загрузки) */}
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
