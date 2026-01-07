import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ServiceButtons from '../ServiceButtons/ServiceButtons.jsx';
import styles from './ManageContent.module.scss';

/**
 * Административная панель управления контентом.
 * Реализует CRUD-логику для списка новостей.
 */
function ManageContent() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Состояние-триггер для обновления списка после редактирования/добавления
    const [refreshListCount, setRefreshListCount] = useState(0);

    // Загрузка статей из БД
    useEffect(() => {
        async function fetchArticles() {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/api/articles');
                
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
                }
                
                const data = await response.json();
                setArticles(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchArticles();
    }, [refreshListCount]);

    /**
     * Обработка удаления статьи
     * @param {string} articleId - ID удаляемой записи
     */
    const handleDelete = async (articleId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту статью?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/articles/${articleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Ошибка при удалении: ${response.status}`);
            }
            
            // Оптимистичное обновление UI: убираем статью из стейта
            setArticles(prevArticles => prevArticles.filter(a => a.id !== articleId));
            alert('Статья успешно удалена!');

        } catch (e) {
            alert(`Ошибка при удалении: ${e.message}`);
        }
    };

    // Функция для провокации ререндера списка (передается в ServiceButtons)
    const handleChange = () => {
        setRefreshListCount(prev => prev + 1);
    };

    if (loading) return <div className={styles.status_info}>Загрузка...</div>;
    if (error) return <div className={styles.status_info}>Ошибка: {error}</div>;

    return (
        <section id={styles.manage_content_container}>
            {/* Кнопка добавления новой статьи */}
            <ServiceButtons shown="add" onChange={handleChange} />
            
            <h1>Управление Контентом</h1>

            <div className={styles.articles_block}>
                {articles.map((article) => (
                    <div key={article.id || article.slug} className={styles.article_block}>
                        <Link 
                            to={`/manage/${article.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                        >
                            <img src={article.image} alt={article.title} />
                            <h2>{article.title}</h2>
                        </Link>
                        
                        <p>{article.except}</p>
                        
                        {/* Кнопки управления конкретной статьей */}
                        <ServiceButtons 
                            article={article} 
                            onDelete={handleDelete} 
                            onChange={handleChange} 
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}

export default ManageContent;
