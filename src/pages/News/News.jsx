import React from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import styles from './News.module.scss';

/**
 * Компонент страницы "Новости" для отображения статей категории "Новости"
 * Ключевые особенности реализации:
 * 1. Бесконечная прокрутка через кастомный хук useInfiniteScroll
 * 2. Ленивая загрузка изображений для оптимизации производительности
 * 3. Полная обработка состояний: загрузка, ошибки, пустой список, конец списка
 * 4. Динамическая загрузка данных с пагинацией с сервера
 * 
 * @returns {JSX.Element} Страница со списком новостных статей
 */
function News() {
    // Использование кастомного хука для реализации бесконечной прокрутки
    // Хук автоматически загружает новые статьи при прокрутке к последнему элементу
    const {
        data: articles,        // Массив загруженных статей
        loading,               // Флаг состояния загрузки
        error,                 // Объект ошибки (если возникла)
        hasMore,              // Флаг наличия дополнительных данных на сервере
        lastElementRef        // Ref для отслеживания последнего элемента (триггер загрузки)
    } = useInfiniteScroll('http://localhost:5000/api/articles/paginated', {
        category: 'Новости',   // Фильтр по категории "Новости"
        limit: 10              // Количество статей, загружаемых за один запрос
    });

    // Состояние: начальная загрузка (когда список статей пуст)
    // Отображается индикатор загрузки
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

    // Состояние: ошибка при первоначальной загрузке
    // Отображается сообщение об ошибке
    if (error && articles.length === 0) {
        return (
            <section className={styles.news_page}>
                <div className={styles.error}>
                    <p>Ошибка загрузки: {error}</p>
                </div>
            </section>
        );
    }

    // Основной рендеринг списка новостей
    return (
        <section className={styles.news_page}>
            <div className={styles.news_page_block}>
                {articles.map((article, index) => {
                    // Определение, является ли элемент последним в текущем списке
                    const isLastElement = index === articles.length - 1;
                    
                    return (
                        <div
                            key={article.id}
                            className={styles.news_block}
                            // Прикрепление рефа только к последнему элементу для триггера загрузки
                            ref={isLastElement ? lastElementRef : null}
                        >
                            {/* Ссылка на детальную страницу новости */}
                            <Link to={`/news/${article.slug}`}>
                                {/* Изображение новости с оптимизацией загрузки */}
                                <img
                                    src={article.image}          // URL изображения
                                    alt={article.title}          // Альтернативный текст для доступности
                                    loading="lazy"              // Ленивая загрузка: изображение загружается при приближении к viewport
                                    decoding="async"            // Асинхронное декодирование для улучшения производительности рендеринга
                                />
                                {/* Заголовок новости */}
                                <h2>{article.title}</h2>
                            </Link>
                            {/* Краткое описание (анонс) новости */}
                            <p className={styles.scrolling_element}>{article.excerpt}</p>
                        </div>
                    );
                })}

                {/* Индикатор загрузки дополнительных данных при бесконечной прокрутке */}
                {loading && articles.length > 0 && (
                    <div className={styles.loadingMore}>
                        <div className={styles.spinner}></div>
                        <p>Загрузка...</p>
                    </div>
                )}

                {/* Сообщение о достижении конца всех доступных новостей */}
                {!hasMore && articles.length > 0 && (
                    <div className={styles.endMessage}>
                        <p>Вы просмотрели все новости</p>
                    </div>
                )}

                {/* Состояние: успешная загрузка, но новости отсутствуют */}
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
