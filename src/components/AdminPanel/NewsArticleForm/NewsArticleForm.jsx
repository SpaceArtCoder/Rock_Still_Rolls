import { useState, useEffect } from 'react';
import styles from './NewsArticleForm.module.scss';
import VideoInsertModal from '../../VideoInsertModal/VideoInsertModal'; // НОВЫЙ ИМПОРТ

const NewsArticleForm = ({article = null, onChange}) => {
    const initialFormState = {
        title: article ? article.title : '',
        content: article ? article.content : '',
        excerpt: article ? article.excerpt : '',
        slug: article ? article.slug : '',
        status: 'draft', 
    };

    const [formData, setFormData] = useState(initialFormState);
    const [selectedCategoryName, setSelectedCategoryName] = useState('Новости');
    const [imageFile, setImageFile] = useState(null); 
    const [message, setMessage] = useState(null);
    const [isError, setIsError] = useState(false);
    const [illustrationFile, setIllustrationFile] = useState(null); 
    const [uploading, setUploading] = useState(false);
    const [illustrationCaption, setIllustrationCaption] = useState('');

    // НОВОЕ: Состояние для модального окна видео
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    useEffect(() => {
        if (message) {
            const messageTimer = setTimeout(() => setMessage(null), 3000);
            return () => {
                clearTimeout(messageTimer);
            }
        }
    }, [message])

    useEffect(() => {
        const newInitialState = {
            title: article ? article.title : '',
            content: article ? article.content : '',
            excerpt: article ? article.excerpt : '',
            slug: article ? article.slug : '',
            status: article ? article.status : 'draft', 
        };
        
        setFormData(newInitialState);
        setImageFile(null); 
        const fileInput = document.getElementById('articleImageFile');
        if (fileInput) fileInput.value = '';
    }, [article]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'imageFile') {
            setImageFile(files[0] || null);
            return;
        }

        if (name === 'illustrationFile') {
            setIllustrationFile(files[0] || null);
            return;
        }

        if (name === 'illustrationCaption') {
            setIllustrationCaption(value);
            return;
        }

        if (name === 'title' && !formData.slug) {
             const generatedSlug = value.toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-+|-+$/g, '');
             setFormData(prev => ({ ...prev, slug: generatedSlug, title: value }));
             return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleIllustrationUpload = async () => {
        if (!illustrationFile) {
            setMessage('Error: Select an image file first.');
            setIsError(true);
            return;
        }
        
        setUploading(true);
        setMessage('Uploading illustration...');
        setIsError(false);
        
        const uploadPayload = new FormData();
        uploadPayload.append('uploadFile', illustrationFile); 
        
        try {
            const response = await fetch('https://uncramped-robbin-patrimonial.ngrok-free.dev/api/articles/upload-image', {
                method: 'POST',
                body: uploadPayload,
            });
            
            const result = await response.json();
            
            if (response.ok) {
                const imageUrl = result.url; 
                const captionText = illustrationCaption.trim() || 'Иллюстрация к статье';
                
                const markdownSyntax = `\n\n<figure style="text-align: center; margin: 20px 0;">
  <img src="http://localhost:5000${imageUrl}" alt="${captionText}" style="max-width: 100%; height: auto; margin-bottom: 5px;" />
  <figcaption style="font-size: 0.85em; color: #666; font-style: italic; max-width: 80%; margin: 0 auto;">
    ${captionText}
  </figcaption>
</figure>\n\n`;

                setFormData(prev => ({
                    ...prev,
                    content: prev.content + markdownSyntax,
                }));

                setMessage('Success! Markdown code inserted into Content.');
                setUploading(false);
                setIllustrationFile(null);
                setIllustrationCaption('');
                const fileInput = document.getElementById('illustrationFileInput');
                if (fileInput) fileInput.value = '';

            } else {
                setMessage(`Error uploading file: ${result.error || 'Server error.'}`);
                setIsError(true);
                setUploading(false);
            }
            
        } catch (error) {
            setMessage('Network error during upload.');
            setIsError(true);
            setUploading(false);
        }
    };

    // НОВАЯ ФУНКЦИЯ: Вставка видео из модального окна
    const handleVideoInsert = (embedCode) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + embedCode,
        }));
        setMessage('Видео успешно добавлено в контент! 🎥');
        setIsError(false);
    };

    const handleSubmit = async (e, action) => {
        if (e) e.preventDefault();
        setMessage('Saving...');
        setIsError(false);
        
        const formPayload = new FormData();

        formPayload.append('title', formData.title);
        formPayload.append('content', formData.content);
        formPayload.append('excerpt', formData.excerpt);
        formPayload.append('slug', formData.slug);
        const finalStatus = action === 'publish' ? 'published' : 'draft';
        formPayload.append('status', finalStatus);
        formPayload.append('categoryName', selectedCategoryName);

        if (imageFile) {
            formPayload.append('imageFile', imageFile);
        }

        if (!formData.title || !formData.content || !formData.slug) {
            setMessage('Error: Title, Content, and Slug are required fields.');
            setIsError(true);
            return;
        }

        try {
            const articleId = article ? article.id : null;
            const isEditing = articleId !== null;
            const method = isEditing ? 'PUT' : 'POST';
            const url = `http://localhost:5000/api/articles/${isEditing ? articleId : ''}`; 

            const response = await fetch(url, {
                method: method,
                body: formPayload, 
            });

            const result = await response.json();

            if (response.ok) {
                setMessage(`Success! Article ID: ${result.id}. Status: ${result.status.toUpperCase()}. ${isEditing ? 'Обновлено' : 'Создано'}.`);
                
                if (!isEditing) {
                    setFormData(initialFormState);
                    setImageFile(null); 
                    const fileInput = document.getElementById('articleImageFile');
                    if (fileInput) fileInput.value = '';
                    onChange();
                }
                else onChange();
                

            } else {
                setMessage(`Error saving article: ${result.error || result.message}`);
                setIsError(true);
                console.error('Server Error:', result);
            }
        } catch (error) {
            console.error('Network or Fetch Error:', error);
            setMessage('Failed to connect to the server or file upload failed.');
            setIsError(true);
        }
    };

    const messageClassName = isError ? styles.errorBox : styles.successBox;

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.title}>Article Editor</h1>
            
            {message && (
                <div 
                    className={messageClassName}
                    role="alert"
                >
                    {message}
                </div>
            )}

            <form onSubmit={(e) => e.preventDefault()} className={styles.form}>

                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>Core Content</h2>

                    <div className={styles.formGroup}>
                        <label htmlFor="articleTitle" className={styles.label}>
                            Title *
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            id="articleTitle"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                        <p className={styles.hint}>
                            The main headline of the article.
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="articleSlug" className={styles.label}>
                            URL Slug *
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            id="articleSlug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            required
                        />
                        <p className={styles.hint}>
                            The unique, SEO-friendly part of the URL (e.g., 'my-new-article').
                        </p>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="articleContent" className={styles.label}>
                            Content/Body * (Use Markdown: # H1, **bold**, * list, ![alt](URL))
                        </label>
                        <textarea
                            className={styles.textarea}
                            id="articleContent"
                            name="content"
                            rows="10"
                            value={formData.content}
                            onChange={handleChange}
                            required
                        ></textarea>
                        <p className={styles.hint}>
                            The full text of the article. Use Markdown for formatting.
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="articleExcerpt" className={styles.label}>
                            Excerpt
                        </label>
                        <textarea
                            className={styles.textarea}
                            id="articleExcerpt"
                            name="excerpt"
                            rows="3"
                            value={formData.excerpt}
                            onChange={handleChange}
                        ></textarea>
                        <p className={styles.hint}>
                            A short summary for previews and listings.
                        </p>
                    </div>

                </fieldset>

                {/* 🎬 НОВАЯ СЕКЦИЯ ДЛЯ ВИДЕО */}
                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>🎬 Video Content</h2>
                    
                    <div className={styles.formGroup}>
                        <button
                            type="button"
                            className={styles.publishButton}
                            onClick={() => setIsVideoModalOpen(true)}
                        >
                            📹 Insert Video (YouTube, Vimeo, RuTube, VK)
                        </button>
                        <p className={styles.hint}>
                            Открывает окно для вставки видео с различных платформ. 
                            Поддержка: YouTube, Vimeo, RuTube, VK Video.
                        </p>
                    </div>
                </fieldset>

                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>Inline Illustrations Uploader</h2>

                    <div className={styles.formGroup}>
                        <label htmlFor="illustrationCaptionInput" className={styles.label}>
                            Image Caption (Подпись)
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            id="illustrationCaptionInput"
                            name="illustrationCaption"
                            value={illustrationCaption}
                            onChange={handleChange}
                            placeholder="Например: Снимок с концерта..."
                        />
                        <p className={styles.hint}>
                            Текст, который будет отображаться под изображением мелким шрифтом.
                        </p>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="illustrationFileInput" className={styles.label}>
                            Upload Inline Image
                        </label>
                        <input
                            className={styles.input}
                            type="file"
                            id="illustrationFileInput" 
                            name="illustrationFile"
                            accept="image/*"
                            onChange={handleChange}
                            disabled={uploading}
                        />
                        {illustrationFile && (
                            <p className={styles.hint}>
                                File ready: {illustrationFile.name}
                            </p>
                        )}
                        <button
                            type="button"
                            className={styles.publishButton}
                            onClick={handleIllustrationUpload}
                            disabled={!illustrationFile || uploading}
                            style={{ marginTop: '10px' }}
                        >
                            {uploading ? 'Uploading...' : 'Upload & Insert Markdown'}
                        </button>
                        <p className={styles.hint}>
                            Загружает изображение и вставляет HTML-код (с &lt;figcaption&gt;) в Content.
                        </p>
                    </div>
                </fieldset>

                <fieldset className={styles.fieldSet}>
                    <h2 className={styles.fieldSetTitle}>Media and Status</h2>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="articleImageFile" className={styles.label}>
                            Featured Image Upload
                        </label>
                        <input
                            className={styles.input}
                            type="file"
                            id="articleImageFile" 
                            name="imageFile"
                            accept="image/*"
                            onChange={handleChange}
                        />
                        {imageFile && (
                            <p className={styles.hint}>
                                File selected: {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                            </p>
                        )}
                        <p className={styles.hint}>
                            Upload the featured image (Max 5MB). The URL path will be saved in the database.
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="articleStatus" className={styles.label}>
                            Default Status
                        </label>
                        <select
                            className={styles.select}
                            id="articleStatus"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled
                        >
                            <option value="draft">Draft (Черновик)</option>
                            <option value="published">Published (Опубликовано)</option>
                        </select>
                        <p className={styles.hint}>
                            The status will be set by the Save Draft or Publish Article button.
                        </p>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="articleCategory" className={styles.label}>
                            Primary Category
                        </label>
                        <select
                            className={styles.select}
                            id="articleCategory"
                            name="category"
                            value={selectedCategoryName}
                            onChange={(e) => setSelectedCategoryName(e.target.value)}
                        >
                            <option value="Новости">Новости (по умолчанию)</option>
                            <option value="Исполнители">Исполнители</option>
                            <option value="События">События</option>
                        </select>
                        <p className={styles.hint}>
                            "События" будут также добавлены в общую категорию "Новости". "Исполнители" будут только в своей категории.
                        </p>
                    </div>

                </fieldset>

                <div className={styles.formActions}>
                    <button
                        type="button"
                        className={styles.draftButton}
                        onClick={() => handleSubmit(null, 'draft')}
                    >
                        Save Draft
                    </button>
                    <button
                        type="button"
                        className={styles.publishButton}
                        onClick={() => handleSubmit(null, 'publish')}
                    >
                        Publish Article
                    </button>
                </div>
            </form>

            {/* МОДАЛЬНОЕ ОКНО ДЛЯ ВИДЕО */}
            <VideoInsertModal
                isOpen={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                onInsert={handleVideoInsert}
            />
        </div>
    );
};

export default NewsArticleForm;