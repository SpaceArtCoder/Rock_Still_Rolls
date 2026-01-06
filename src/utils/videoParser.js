// utils/videoParser.js

/**
 * Извлекает ID видео из различных форматов YouTube URL
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  
  // Уже ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // youtube.com/watch?v=ID
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1].split('&')[0];
  }
  
  // youtu.be/ID
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0];
  }
  
  // youtube.com/embed/ID
  if (url.includes('youtube.com/embed/')) {
    return url.split('embed/')[1].split('?')[0];
  }
  
  // youtube.com/shorts/ID
  if (url.includes('youtube.com/shorts/')) {
    return url.split('shorts/')[1].split('?')[0];
  }
  
  return null;
};

/**
 * Извлекает ID видео из Vimeo URL
 */
export const extractVimeoId = (url) => {
  if (!url) return null;
  
  // Уже ID
  if (/^\d+$/.test(url)) {
    return url;
  }
  
  // vimeo.com/ID
  if (url.includes('vimeo.com/')) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }
  
  // player.vimeo.com/video/ID
  if (url.includes('player.vimeo.com/video/')) {
    return url.split('video/')[1].split('?')[0];
  }
  
  return null;
};

/**
 * Извлекает ID видео из Rutube URL
 */
export const extractRutubeId = (url) => {
  if (!url) return null;
  
  // Уже ID
  if (/^[a-f0-9]{32}$/.test(url)) {
    return url;
  }
  
  // rutube.ru/video/ID
  if (url.includes('rutube.ru/video/')) {
    return url.split('video/')[1].split('/')[0].split('?')[0];
  }
  
  // rutube.ru/play/embed/ID
  if (url.includes('rutube.ru/play/embed/')) {
    return url.split('embed/')[1].split('?')[0];
  }
  
  return null;
};

/**
 * Извлекает ID видео из VK Video URL
 */
export const extractVKVideoId = (url) => {
  if (!url) return null;
  
  // vk.com/video-OWNER_ID_VIDEO_ID
  if (url.includes('vk.com/video')) {
    const match = url.match(/video(-?\d+_\d+)/);
    return match ? match[1] : null;
  }
  
  return null;
};

/**
 * Генерирует HTML embed код для YouTube
 */
export const generateYouTubeEmbed = (videoId, caption = '') => {
  if (!videoId) return '';
  
  const iframe = `<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://www.youtube.com/embed/${videoId}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen>
  </iframe>`;
  
  return generateVideoWrapper(iframe, caption, 'youtube');
};

/**
 * Генерирует HTML embed код для Vimeo
 */
export const generateVimeoEmbed = (videoId, caption = '') => {
  if (!videoId) return '';
  
  const iframe = `<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
    title="Vimeo video player"
    allowfullscreen>
  </iframe>`;
  
  return generateVideoWrapper(iframe, caption, 'vimeo');
};

/**
 * Генерирует HTML embed код для Rutube
 */
export const generateRutubeEmbed = (videoId, caption = '') => {
  if (!videoId) return '';
  
  const iframe = `<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://rutube.ru/play/embed/${videoId}" 
    frameborder="0" 
    allow="clipboard-write; autoplay" 
    webkitAllowFullScreen 
    mozallowfullscreen 
    allowfullscreen
    title="Rutube video player">
  </iframe>`;
  
  return generateVideoWrapper(iframe, caption, 'rutube');
};

/**
 * Генерирует HTML embed код для VK Video
 */
export const generateVKVideoEmbed = (videoId, caption = '') => {
  if (!videoId) return '';
  
  // VK требует особый формат: oid и id отдельно
  const [oid, id] = videoId.split('_');
  
  const iframe = `<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://vk.com/video_ext.php?oid=${oid}&id=${id}&hd=2" 
    frameborder="0" 
    allowfullscreen 
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
    title="VK video player">
  </iframe>`;
  
  return generateVideoWrapper(iframe, caption, 'vk');
};

/**
 * Создает обертку для видео с подписью
 */
const generateVideoWrapper = (iframeCode, caption, platform) => {
  const captionHtml = caption 
    ? `<figcaption style="font-size: 0.9em; color: #666; font-style: italic; text-align: center; margin-top: 10px; padding: 0 10px;">
        ${caption}
      </figcaption>` 
    : '';
  
  return `
<figure class="video-embed video-embed-${platform}" style="margin: 30px 0;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
    ${iframeCode}
  </div>
  ${captionHtml}
</figure>
`;
};

/**
 * Парсит шорткоды видео в контенте
 * Поддерживает форматы:
 * [youtube]URL_OR_ID[/youtube]
 * [vimeo]URL_OR_ID[/vimeo]
 * [rutube]URL_OR_ID[/rutube]
 * [vk]URL_OR_ID[/vk]
 * [youtube:ID caption="Текст"]
 */
export const parseVideoShortcodes = (content) => {
  if (!content) return content;
  
  let processedContent = content;
  
  // YouTube шорткоды
  processedContent = processedContent.replace(
    /\[youtube(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/youtube\])/gi,
    (match, urlOrId, caption = '') => {
      const videoId = extractYouTubeId(urlOrId.trim());
      return videoId ? generateYouTubeEmbed(videoId, caption) : match;
    }
  );
  
  // Vimeo шорткоды
  processedContent = processedContent.replace(
    /\[vimeo(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/vimeo\])/gi,
    (match, urlOrId, caption = '') => {
      const videoId = extractVimeoId(urlOrId.trim());
      return videoId ? generateVimeoEmbed(videoId, caption) : match;
    }
  );
  
  // Rutube шорткоды
  processedContent = processedContent.replace(
    /\[rutube(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/rutube\])/gi,
    (match, urlOrId, caption = '') => {
      const videoId = extractRutubeId(urlOrId.trim());
      return videoId ? generateRutubeEmbed(videoId, caption) : match;
    }
  );
  
  // VK Video шорткоды
  processedContent = processedContent.replace(
    /\[vk(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/vk\])/gi,
    (match, urlOrId, caption = '') => {
      const videoId = extractVKVideoId(urlOrId.trim());
      return videoId ? generateVKVideoEmbed(videoId, caption) : match;
    }
  );
  
  return processedContent;
};

/**
 * Определяет платформу по URL
 */
export const detectVideoPlatform = (url) => {
  if (!url) return null;
  
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }
  if (url.includes('rutube.ru')) {
    return 'rutube';
  }
  if (url.includes('vk.com')) {
    return 'vk';
  }
  
  return null;
};

/**
 * Универсальная функция для вставки видео
 */
export const insertVideoEmbed = (url, caption = '') => {
  const platform = detectVideoPlatform(url);
  
  if (!platform) {
    return null;
  }
  
  let videoId = null;
  let embedCode = '';
  
  switch (platform) {
    case 'youtube':
      videoId = extractYouTubeId(url);
      embedCode = videoId ? generateYouTubeEmbed(videoId, caption) : null;
      break;
    case 'vimeo':
      videoId = extractVimeoId(url);
      embedCode = videoId ? generateVimeoEmbed(videoId, caption) : null;
      break;
    case 'rutube':
      videoId = extractRutubeId(url);
      embedCode = videoId ? generateRutubeEmbed(videoId, caption) : null;
      break;
    case 'vk':
      videoId = extractVKVideoId(url);
      embedCode = videoId ? generateVKVideoEmbed(videoId, caption) : null;
      break;
  }
  
  return embedCode;
};