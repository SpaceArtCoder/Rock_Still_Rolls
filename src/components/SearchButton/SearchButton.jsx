import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchButton.module.scss';

const SearchButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

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

    const performSearch = async (query) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `https://uncramped-robbin-patrimonial.ngrok-free.dev/api/articles/search?q=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            setSearchResults(data);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    // ОБНОВЛЕННАЯ ФУНКЦИЯ
    const handleResultClick = (article) => {
        // Определяем маршрут на основе категории
        let path = '/news/'; // По умолчанию
        
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

    const toggleSearch = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
        }
    };

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

                <div className={styles.resultsContainer}>
                    {isLoading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            Поиск...
                        </div>
                    ) : searchQuery.trim() && searchResults.length === 0 ? (
                        <div className={styles.noResults}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4M12 16h.01" />
                            </svg>
                            <p>Ничего не найдено</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <ul className={styles.resultsList}>
                            {searchResults.map((article) => (
                                <li
                                    key={article.id}
                                    className={styles.resultItem}
                                    onClick={() => handleResultClick(article)}
                                >
                                    {article.image && (
                                        <img
                                            src={`http://localhost:5000${article.image}`}
                                            alt={article.title}
                                            className={styles.resultImage}
                                        />
                                    )}
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.resultTitle}>
                                            {highlightText(article.title, searchQuery)}
                                        </h3>
                                        {article.excerpt && (
                                            <p className={styles.resultExcerpt}>
                                                {highlightText(
                                                    article.excerpt.substring(0, 100) + '...',
                                                    searchQuery
                                                )}
                                            </p>
                                        )}
                                        <span className={styles.resultDate}>
                                            {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>

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