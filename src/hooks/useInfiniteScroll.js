// src/hooks/useInfiniteScroll.js
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

/**
 * Хук для бесконечной прокрутки (Infinite Scroll)
 *
 * @param {string} endpoint - API endpoint (например, '/api/articles/paginated')
 * @param {object} params - Параметры запроса (category, limit и т.д.)
 * @returns {object} { data, loading, error, hasMore, loadMore, refresh }
 */
export const useInfiniteScroll = (endpoint, params = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState(null);

    const observerRef = useRef(null);
    const loadingRef = useRef(false);

    // Загрузка данных
    const loadData = useCallback(async (isRefresh = false) => {
        if (loadingRef.current) return;
        if (!isRefresh && !hasMore) return;

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(endpoint, {
                params: {
                    ...params,
                    cursor: isRefresh ? null : cursor,
                    limit: params.limit || 10
                }
            });

            const { articles, nextCursor, hasMore: moreAvailable } = response.data;

            setData(prev => isRefresh ? articles : [...prev, ...articles]);
            setCursor(nextCursor);
            setHasMore(moreAvailable);

        } catch (err) {
            console.error('Load data error:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
            loadingRef.current = false;
        }
    }, [endpoint, params, cursor, hasMore]);

    // Первоначальная загрузка
    useEffect(() => {
        setData([]);
        setCursor(null);
        setHasMore(true);
        loadData(true);
    }, [endpoint, JSON.stringify(params)]); // Перезагрузка при смене параметров

    // Функция для загрузки следующей порции
    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            loadData(false);
        }
    }, [loading, hasMore, loadData]);

    // Функция для обновления с начала
    const refresh = useCallback(() => {
        setData([]);
        setCursor(null);
        setHasMore(true);
        loadData(true);
    }, [loadData]);

    // Intersection Observer для автоматической загрузки
    const lastElementRef = useCallback((node) => {
        if (loading) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        }, {
            rootMargin: '200px' // Загружаем за 200px до конца
        });

        if (node) observerRef.current.observe(node);
    }, [loading, hasMore, loadMore]);

    return {
        data,
        loading,
        error,
        hasMore,
        loadMore,
        refresh,
        lastElementRef
    };
};

export default useInfiniteScroll;