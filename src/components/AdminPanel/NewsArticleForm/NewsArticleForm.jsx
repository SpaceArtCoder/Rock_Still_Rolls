import { useState, useEffect } from 'react';
import styles from './NewsArticleForm.module.scss';
import VideoInsertModal from '../../VideoInsertModal/VideoInsertModal';

/**
 * Форма создания и редактирования новостных статей.
 * Поддерживает загрузку файлов и вставку медиа-контента.
 */
const NewsArticleForm = ({ article = null, onChange }) => {
    const initialFormState = {
        title: article ? article.title : '',
        content: article ? article.content : '',
        excerpt: article ? article.excerpt : '',
        slug: article ? article.slug : '',
        status: article ? article.status : 'draft',
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedCategoryName, setSelectedCategoryName] = useState('Новости');
    const [imageFile, setImageFile] = useState(null);
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    
    // Состояния для дополнительных медиа
    const [illustrationFile, setIllustrationFile] = useState(null);
    const [illustrationCaption, setIllustrationCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Таймер для автоматического скрытия уведомлений
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Синхронизация формы при смене активной статьи
    useEffect(() => {
        setFormData({
            title: article ? article.title : '',
            content: article ? article.content : '',
            excerpt: article ? article.excerpt : '',
            slug: article ? article.slug : '',
            status: article ? article.status : 'draft',
        });
        setImageFile(null);
    }, [article]);

    /**
     * Универсальный обработчик полей ввода
     */
    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'imageFile') return setImageFile(files[0] || null);
        if (name === 'illustrationFile') return setIllustrationFile(files[0] || null);
        if (name === 'illustrationCaption') return setIllustrationCaption(value);

        // Автогенерация Slug из заголовка (если slug еще не редактировался вручную)
        if (name === 'title' && !article) {
            const generatedSlug = value
                .toLowerCase()
                .replace(/[^a-z0-9а-яё]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, title: value, slug: generatedSlug }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Загрузка изображения-иллюстрации и вставка кода в Content
     */
    const handleIllustrationUpload = async () => {
        if (!illustrationFile) return;

        setUploading(true);
        const uploadPayload = new FormData();
        uploadPayload.append('uploadFile', illustrationFile);

        try {
            const response = await fetch('http://localhost:5000/api/articles/upload-image', {
                method: 'POST',
                body: uploadPayload,
            });

            const result = await response.json();

            if (response.ok) {
                const captionText = illustrationCaption.trim() || 'Иллюстрация';
                const htmlInsert = `\n\n<figure style="text-align: center; margin: 20px 0;">\n  <img src="http://localhost:5000${result.url}" alt="${captionText}" style="max-width: 100%; height: auto;" />\n  <figcaption style="font-size: 0.85em; color: #666; font-style: italic;">${captionText}</figcaption>\n</figure>\n\n`;

                setFormData(prev => ({ ...prev, content: prev.content + htmlInsert }));
                setMessage('Изображение добавлено в текст!');
                setIllustrationFile(null);
                setIllustrationCaption('');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setMessage(`Ошибка загрузки: ${error.message}`);
            setIsError(true);
        } finally {
            setUploading(false);
        }
    };

    /**
     * Вставка видео-кода из модального окна
     */
    const handleVideoInsert = (embedCode) => {
        setFormData(prev => ({ ...prev, content: prev.content + `\n${embedCode}\n` }));
        setMessage('Видео успешно добавлено! 🎥');
    };

    /**
     * Финальная отправка статьи (Создание или Обновление)
     */
    const handleSubmit = async (e, action) => {
        if (e) e.preventDefault();
        
        if (!formData.title || !formData.content || !formData.slug) {
            setMessage('Ошибка: Заполните обязательные поля (Title, Content, Slug)');
            setIsError(true);
            return;
        }

        const formPayload = new FormData();
        Object.keys(formData).forEach(key => formPayload.append(key, formData[key]));
        formPayload.set('status', action === 'publish' ? 'published' : 'draft');
        formPayload.append('categoryName', selectedCategoryName);
        if (imageFile) formPayload.append('imageFile', imageFile);

        try {
            const url = `http://localhost:5000/api/articles/${article?.id || ''}`;
            const response = await fetch(url, {
                method: article ? 'PUT' : 'POST',
                body: formPayload,
            });

            if (response.ok) {
                setMessage('Статья успешно сохранена!');
                onChange(); // Обновляем список в родителе
            } else {
                const err = await response.json();
                setMessage(`Ошибка: ${err.error || 'Не удалось сохранить'}`);
                setIsError(true);
            }
        } catch (error) {
            setMessage('Ошибка сети');
            setIsError(true);
        }
    };

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>Редактор статьи</h1>

            {message && <div className={isError ? styles.errorBox : styles.successBox}>{message}</div>}

            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                {/* Основной контент */}
                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>Основная информация</h2>
                    
                    <div className={styles.formGroup}>
                        <label>Заголовок *</label>
                        <input className={styles.input} name="title" value={formData.title} onChange={handleChange} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>URL Slug *</label>
                        <input className={styles.input} name="slug" value={formData.slug} onChange={handleChange} required />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Контент (Markdown/HTML) *</label>
                        <textarea className={styles.textarea} name="content" rows="12" value={formData.content} onChange={handleChange} required />
                    </div>
                </fieldset>

                {/* Медиа-инструменты */}
                <div className={styles.mediaGrid}>
                    <fieldset className={styles.fieldSet}>
                        <h2 className={styles.fieldSetTitle}>🎬 Видео</h2>
                        <button type="button" className={styles.publishButton} onClick={() => setIsVideoModalOpen(true)}>
                            📹 Вставить видео
                        </button>
                    </fieldset>

                    <fieldset className={styles.fieldSet}>
                        <h2 className={styles.fieldSetTitle}>🖼️ Иллюстрация в текст</h2>
                        <input className={styles.input} type="text" name="illustrationCaption" value={illustrationCaption} onChange={handleChange} placeholder="Подпись..." />
                        <input className={styles.input} type="file" name="illustrationFile" onChange={handleChange} />
                        <button type="button" className={styles.publishButton} onClick={handleIllustrationUpload} disabled={!illustrationFile || uploading}>
                            {uploading ? 'Загрузка...' : 'Загрузить и вставить'}
                        </button>
                    </fieldset>
                </div>

                {/* Главное фото и настройки */}
                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>Настройки публикации</h2>
                    <div className={styles.formGroup}>
                        <label>Главное изображение (Featured Image)</label>
                        <input className={styles.input} type="file" name="imageFile" onChange={handleChange} />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Категория</label>
                        <select className={styles.select} value={selectedCategoryName} onChange={(e) => setSelectedCategoryName(e.target.value)}>
                            <option value="Новости">Новости</option>
                            <option value="Исполнители">Исполнители</option>
                            <option value="События">События</option>
                        </select>
                    </div>
                </fieldset>

                {/* Кнопки действий */}
                <div className={styles.formActions}>
                    <button type="button" className={styles.draftButton} onClick={() => handleSubmit(null, 'draft')}>
                        Сохранить черновик
                    </button>
                    <button type="button" className={styles.publishButton} onClick={() => handleSubmit(null, 'publish')}>
                        Опубликовать статью
                    </button>
                </div>
            </form>

            <VideoInsertModal 
                isOpen={isVideoModalOpen} 
                onClose={() => setIsVideoModalOpen(false)} 
                onInsert={handleVideoInsert} 
            />
        </div>
    );
};

export default NewsArticleForm;
