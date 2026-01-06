import React, { useState, useEffect } from 'react';
import styles from './VideoInsertModal.module.scss';
import { detectVideoPlatform, insertVideoEmbed } from '../../utils/videoParser';

const VideoInsertModal = ({ isOpen, onClose, onInsert }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState(null);
  const [embedType, setEmbedType] = useState('html'); // 'html' или 'shortcode'
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVideoUrl('');
      setCaption('');
      setPlatform(null);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (videoUrl) {
      const detectedPlatform = detectVideoPlatform(videoUrl);
      setPlatform(detectedPlatform);
      if (!detectedPlatform) {
        setError('Не удалось определить платформу. Поддерживаются: YouTube, Vimeo, Rutube, VK Video');
      } else {
        setError('');
      }
    } else {
      setPlatform(null);
      setError('');
    }
  }, [videoUrl]);

  const handleInsert = () => {
    if (!videoUrl) {
      setError('Введите URL видео');
      return;
    }

    if (!platform) {
      setError('Неподдерживаемая платформа видео');
      return;
    }

    if (embedType === 'html') {
      // Генерируем HTML embed код
      const embedCode = insertVideoEmbed(videoUrl, caption);
      if (embedCode) {
        onInsert(`\n\n${embedCode}\n\n`);
        onClose();
      } else {
        setError('Не удалось создать embed код');
      }
    } else {
      // Генерируем шорткод
      const captionAttr = caption ? ` caption="${caption}"` : '';
      const shortcode = `\n\n[${platform}]${videoUrl}${captionAttr}[/${platform}]\n\n`;
      onInsert(shortcode);
      onClose();
    }
  };

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const platformIcons = {
    youtube: '🎥',
    vimeo: '📹',
    rutube: '🎬',
    vk: '🎞️'
  };

  const platformNames = {
    youtube: 'YouTube',
    vimeo: 'Vimeo',
    rutube: 'RuTube',
    vk: 'VK Video'
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className={styles.header}>
          <h2 className={styles.title}>📹 Вставить видео</h2>
          <p className={styles.subtitle}>
            Поддерживаются: YouTube, Vimeo, RuTube, VK Video
          </p>
        </div>

        <div className={styles.content}>
          {/* URL видео */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>URL видео *</label>
            <input
              type="text"
              className={styles.input}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
            />
            {platform && (
              <div className={styles.platformBadge}>
                {platformIcons[platform]} {platformNames[platform]}
              </div>
            )}
            <p className={styles.hint}>
              Примеры форматов:
            </p>
            <ul className={styles.exampleList}>
              <li>🎥 YouTube: youtube.com/watch?v=ID или youtu.be/ID</li>
              <li>📹 Vimeo: vimeo.com/ID</li>
              <li>🎬 RuTube: rutube.ru/video/ID</li>
              <li>🎞️ VK: vk.com/video-123_456</li>
            </ul>
          </div>

          {/* Подпись */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Подпись (опционально)</label>
            <input
              type="text"
              className={styles.input}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Описание видео..."
            />
            <p className={styles.hint}>
              Текст, который будет отображаться под видео
            </p>
          </div>

          {/* Тип вставки */}
          <div className={styles.inputGroup}>
            <label className={styles.label}>Тип вставки</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="html"
                  checked={embedType === 'html'}
                  onChange={(e) => setEmbedType(e.target.value)}
                />
                <span>HTML iframe (рекомендуется)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="shortcode"
                  checked={embedType === 'shortcode'}
                  onChange={(e) => setEmbedType(e.target.value)}
                />
                <span>Шорткод [youtube]...[/youtube]</span>
              </label>
            </div>
            <p className={styles.hint}>
              {embedType === 'html' 
                ? 'Вставляет готовый HTML-код плеера' 
                : 'Использует специальный синтаксис, который преобразуется при отображении'}
            </p>
          </div>

          {/* Ошибка */}
          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          {/* Превью кода */}
          {platform && !error && (
            <div className={styles.preview}>
              <p className={styles.previewLabel}>Будет вставлено:</p>
              <code className={styles.previewCode}>
                {embedType === 'html' 
                  ? `<figure class="video-embed-${platform}">...</figure>` 
                  : `[${platform}]${videoUrl}${caption ? ` caption="${caption}"` : ''}[/${platform}]`}
              </code>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className={styles.insertButton}
            onClick={handleInsert}
            disabled={!platform || !!error}
          >
            Вставить видео
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoInsertModal;