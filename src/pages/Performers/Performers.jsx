import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './Performers.module.scss';

/**
 * Компонент страницы "Исполнители" для отображения статей категории "Исполнители"
 * Ключевые особенности:
 * 1. Бесконечная прокрутка с автоматической подгрузкой данных
 * 2. Ленивая загрузка изображений исполнителей
 * 3. Сетка карточек с информацией об исполнителях
 * 4. Полная обработка состояний загрузки
 * 
 * Структура данных:
 * - Каждая статья представляет собой карточку исполнителя
 * - Содержит изображение, имя и ссылку на детальную страницу
 * 
 * @returns {JSX.Element} Страница со списком исполнителей в виде сетки карточек
 */
function Performers() {
    // Использование кастомного хука для реализации бесконечной прокрутки исполнителей
    const {
        data: articles,        // Массив статей об исполнителях
        loading,               // Флаг состояния загрузки
        error,                 // Объект ошибки при загрузке
        hasMore,              // Флаг наличия дополнительных данных на сервере
        lastElementRef        // Ref для отслеживания последнего элемента (триггер подгрузки)
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Исполнители', // Фильтр по категории "Исполнители"
        limit: 15                // Количество исполнителей, загружаемых за один запрос
    });

    // Состояние: начальная загрузка (пустой список)
    // Отображается индикатор загрузки
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

    // Состояние: ошибка при первоначальной загрузке
    // Отображается сообщение об ошибке
    if (error && articles.length === 0) {
        return (
            <section className={styles.performers_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    // Основной рендеринг сетки исполнителей
    return (
        <section className={styles.performers_page}>
            <div className={styles.performers_page_block}>
                {articles.map((article, index) => {
                    // Определение последнего элемента для привязки рефа бесконечной прокрутки
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.performers_block}
                            // Реф прикрепляется только к последнему элементу
                            ref={isLastElement ? lastElementRef : null}
                        >
                            {/* Ссылка на детальную страницу исполнителя */}
                            <Link to={`/performers/${article.slug}`}>
                                {/* Изображение исполнителя с оптимизацией загрузки */}
                                <img
                                    src={article.image}          // URL фотографии исполнителя
                                    alt={article.title}          // Альтернативный текст с именем исполнителя
                                    loading="lazy"              // Ленивая загрузка: изображение загружается при прокрутке
                                    decoding="async"            // Асинхронное декодирование для лучшей производительности
                                />
                                {/* Имя исполнителя */}
                                <h2>{article.title}</h2>
                            </Link>
                        </div>
                    );
                })}

                {/* Индикатор загрузки дополнительных исполнителей */}
                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {/* Сообщение о достижении конца списка исполнителей */}
                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели всех исполнителей</p>
                    </div>
                )}

                {/* Состояние: успешная загрузка, но исполнители отсутствуют */}
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
