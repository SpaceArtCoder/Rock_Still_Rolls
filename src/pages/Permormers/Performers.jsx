import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Performers.module.scss';

/**
 * Компонент страницы исполнителей
 * Отображает список исполнителей с поддержкой бесконечной прокрутки
 */
function Performers() {
    // Используем хук для бесконечной прокрутки исполнителей
    const {
        data: articles,
        loading,
        error,
        hasMore,
        lastElementRef
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Исполнители',
        limit: 15 // Можно установить другой лимит для исполнителей
    });

    // Отображение состояния загрузки при первоначальной загрузке
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

    // Отображение ошибки загрузки данных
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
                {/* Отображение списка исполнителей */}
                {articles.map((article, index) => {
                    // Для последнего элемента добавляем ref для триггера бесконечной прокрутки
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.performers_block}
                            ref={isLastElement ? lastElementRef : null}
                        >
                            <Link to={`/performers/${article.slug}`}>
                                <img src={article.image} alt={article.title} />
                                <h2>{article.title}</h2>
                            </Link>
                        </div>
                    );
                })}

                {/* Индикатор загрузки при подгрузке дополнительных исполнителей */}
                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {/* Сообщение о достижении конца списка */}
                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели всех исполнителей</p>
                    </div>
                )}

                {/* Состояние пустого списка исполнителей */}
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
