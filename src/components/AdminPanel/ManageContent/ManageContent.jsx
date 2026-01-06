import { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import ServiceButtons from '../ServiceButtons/ServiceButtons.jsx';
import styles from './ManageContent.module.scss';

function ManageContent() {

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // const [searchParams] = useSearchParams();
    // const category = searchParams.get('category');
    
    //Состояние меняется после закрытия окна редактирования статьи
    const [refreshListCount, setRefreshListCount] = useState(0);

    //retrieving articles from DB
    useEffect(() => {
        async function fetchArticles() {
            try {
                // Запрос к Node.js бэкенду, который слушает порт 5000
                const response = await fetch('http://localhost:5000/api/articles');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
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

    if (loading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div>Ошибка: {error.message}</div>;  
    }

    const handleDelete = async (articleId) => {
    // 1. Подтверждение
    if (!window.confirm("Вы уверены, что хотите удалить эту статью?")) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/articles/${articleId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        // 2. Обновление списка статей на фронтенде (удаляем статью из стейта)
        setArticles(prevArticles => prevArticles.filter(a => a.id !== articleId));
        alert('Статья успешно удалена!');

    } catch (e) {
        setError(e.message);
        alert(`Ошибка при удалении: ${e.message}`);
    }
};

const handleChange = () => {
    setRefreshListCount(refreshListCount + 1);
};

    return (
        <section id={styles.manage_content_container}>
            <ServiceButtons shown='add' onChange={handleChange}/>
            <h1>Управление Контентом</h1>
            <div className={styles.articles_block}>
                {articles.map((article, index) => (
                    <div key={index} className={styles.article_block}>
                        <Link to={`/manage/${article.slug}`} target='_blank' rel='noopener noreferrer'>
                            <img src={article.image} alt={article.title} />
                            <h2>{article.title}</h2>
                        </Link>
                        <p>{article.except}</p>
                        <ServiceButtons article={article} onDelete={handleDelete} onChange={handleChange}/>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default ManageContent;