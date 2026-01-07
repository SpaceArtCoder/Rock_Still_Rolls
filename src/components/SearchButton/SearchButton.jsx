import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchButton.module.scss';

/**
 * Компонент кнопки поиска с выпадающей панелью.
 * Осуществляет поиск статей по введенному запросу с подсветкой результатов.
 */
const SearchButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    /**
     * Эффект для закрытия панели поиска при клике вне компонента.
     * Фокусирует поле ввода при открытии панели.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            inputRef.current?.focus();
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    /**
     * Эффект для закрытия панели поиска при нажатии клавиши Escape.
     */
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    /**
     * Эффект для выполнения поиска с задержкой (debounce).
     * Очищает результаты при пустом запросе.
     */
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timeoutId = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    /**
     * Выполняет поиск статей по API.
     * @param {string} query - Поисковый запрос
     */
    const performSearch = async (query) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/articles/search?q=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Обрабатывает клик по результату поиска.
     * Определяет маршрут на основе категории статьи и выполняет переход.
     * @param {Object} article - Объект статьи
     */
    const handleResultClick = (article) => {
        let path = '/news/';
        
        if (article.categories && article.categories.length > 0) {
            const primaryCategory = article.categories[0];
            
            if (primaryCategory === 'Исполнители') {
                path = '/performers/';
            } else if (primaryCategory === 'События') {
                path = '/events/';
            } else {
                path = '/news/';
            }
        }
        
        navigate(`${path}${article.slug}`);
        setIsOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    /**
     * Переключает состояние панели поиска.
     * Очищает результаты при закрытии.
     */
    const toggleSearch = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    /**
     * Подсвечивает текст в соответствии с поисковым запросом.
     * @param {string} text - Исходный текст
     * @param {string} query - Поисковый запрос
     * @returns {Array|string} - Массив JSX элементов или исходный текст
     */
    const highlightText = (text, query) => {
        if (!query.trim() || !text) return text;
        
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) => 
            part.toLowerCase() === query.toLowerCase() 
                ? <mark key={index} className={styles.highlight}>{part}</mark>
                : part
        );
    };

    return (
        <div ref={searchRef} className={styles.searchContainer}>
            {/* Кнопка открытия/закрытия поиска */}
            <button 
                className={`${styles.searchButton} ${isOpen ? styles.active : ''}`}
                onClick={toggleSearch}
                aria-label="Поиск"
            >
                <svg 
                    className={styles.searchIcon} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
            </button>

            {/* Панель поиска с полем ввода и результатами */}
            <div className={`${styles.searchPanel} ${isOpen ? styles.open : ''}`}>
                <div className={styles.inputWrapper}>
                    <svg 
                        className={styles.inputIcon} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.searchInput}
                        placeholder="Поиск по статьям..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {/* Кнопка очистки поля ввода */}
                    {searchQuery && (
                        <button
                            className={styles.clearButton}
                            onClick={() => setSearchQuery('')}
                            aria-label="Очистить"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Контейнер с результатами поиска */}
                <div className={styles.resultsContainer}>
                    {isLoading ? (
                        // Индикатор загрузки
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            Поиск...
                        </div>
                    ) : searchQuery.trim() && searchResults.length === 0 ? (
                        // Сообщение об отсутствии результатов
                        <div className={styles.noResults}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            <p>Ничего не найдено</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        // Список найденных статей
                        <ul className={styles.resultsList}>
                            {searchResults.map((article) => (
                                <li
                                    key={article.id}
                                    className={styles.resultItem}
                                    onClick={() => handleResultClick(article)}
                                >
                                    {/* Изображение статьи */}
                                    {article.image && (
                                        <img
                                            src={`http://localhost:5000${article.image}`}
                                            alt={article.title}
                                            className={styles.resultImage}
                                        />
                                    )}
                                    <div className={styles.resultContent}>
                                        {/* Заголовок статьи с подсветкой */}
                                        <h3 className={styles.resultTitle}>
                                            {highlightText(article.title, searchQuery)}
                                        </h3>
                                        {/* Краткое описание статьи с подсветкой */}
                                        {article.excerpt && (
                                            <p className={styles.resultExcerpt}>
                                                {highlightText(
                                                    article.excerpt.substring(0, 100) + '...',
                                                    searchQuery
                                                )}
                                            </p>
                                        )}
                                        {/* Дата публикации */}
                                        <span className={styles.resultDate}>
                                            {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                {/* Подсказка при пустом поле поиска */}
                {!searchQuery && (
                    <div className={styles.hint}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                        </svg>
                        <p>Начните вводить для поиска статей по названию, содержимому или описанию</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchButton;
