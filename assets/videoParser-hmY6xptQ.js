const l=e=>e?/^[a-zA-Z0-9_-]{11}$/.test(e)?e:e.includes("youtube.com/watch?v=")?e.split("v=")[1].split("&")[0]:e.includes("youtu.be/")?e.split("youtu.be/")[1].split("?")[0]:e.includes("youtube.com/embed/")?e.split("embed/")[1].split("?")[0]:e.includes("youtube.com/shorts/")?e.split("shorts/")[1].split("?")[0]:null:null,s=e=>{if(!e)return null;if(/^\d+$/.test(e))return e;if(e.includes("vimeo.com/")){const t=e.match(/vimeo\.com\/(\d+)/);return t?t[1]:null}return e.includes("player.vimeo.com/video/")?e.split("video/")[1].split("?")[0]:null},c=e=>e?/^[a-f0-9]{32}$/.test(e)?e:e.includes("rutube.ru/video/")?e.split("video/")[1].split("/")[0].split("?")[0]:e.includes("rutube.ru/play/embed/")?e.split("embed/")[1].split("?")[0]:null:null,a=e=>{if(!e)return null;if(e.includes("vk.com/video")){const t=e.match(/video(-?\d+_\d+)/);return t?t[1]:null}return null},d=(e,t="")=>{if(!e)return"";const r=`<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://www.youtube.com/embed/${e}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen>
  </iframe>`;return u(r,t,"youtube")},p=(e,t="")=>{if(!e)return"";const r=`<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://player.vimeo.com/video/${e}?badge=0&autopause=0&player_id=0&app_id=58479" 
    frameborder="0" 
    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
    title="Vimeo video player"
    allowfullscreen>
  </iframe>`;return u(r,t,"vimeo")},m=(e,t="")=>{if(!e)return"";const r=`<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://rutube.ru/play/embed/${e}" 
    frameborder="0" 
    allow="clipboard-write; autoplay" 
    webkitAllowFullScreen 
    mozallowfullscreen 
    allowfullscreen
    title="Rutube video player">
  </iframe>`;return u(r,t,"rutube")},f=(e,t="")=>{if(!e)return"";const[r,i]=e.split("_"),o=`<iframe 
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
    src="https://vk.com/video_ext.php?oid=${r}&id=${i}&hd=2" 
    frameborder="0" 
    allowfullscreen 
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock;"
    title="VK video player">
  </iframe>`;return u(o,t,"vk")},u=(e,t,r)=>{const i=t?`<figcaption style="font-size: 0.9em; color: #666; font-style: italic; text-align: center; margin-top: 10px; padding: 0 10px;">
        ${t}
      </figcaption>`:"";return`
<figure class="video-embed video-embed-${r}" style="margin: 30px 0;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
    ${e}
  </div>
  ${i}
</figure>
`},v=e=>{if(!e)return e;let t=e;return t=t.replace(/\[youtube(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/youtube\])/gi,(r,i,o="")=>{const n=l(i.trim());return n?d(n,o):r}),t=t.replace(/\[vimeo(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/vimeo\])/gi,(r,i,o="")=>{const n=s(i.trim());return n?p(n,o):r}),t=t.replace(/\[rutube(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/rutube\])/gi,(r,i,o="")=>{const n=c(i.trim());return n?m(n,o):r}),t=t.replace(/\[vk(?::|\])([^\]]+?)(?:\scaption="([^"]*?)")?(?:\]|\[\/vk\])/gi,(r,i,o="")=>{const n=a(i.trim());return n?f(n,o):r}),t},b=e=>e?e.includes("youtube.com")||e.includes("youtu.be")?"youtube":e.includes("vimeo.com")?"vimeo":e.includes("rutube.ru")?"rutube":e.includes("vk.com")?"vk":null:null,y=(e,t="")=>{const r=b(e);if(!r)return null;let i=null,o="";switch(r){case"youtube":i=l(e),o=i?d(i,t):null;break;case"vimeo":i=s(e),o=i?p(i,t):null;break;case"rutube":i=c(e),o=i?m(i,t):null;break;case"vk":i=a(e),o=i?f(i,t):null;break}return o};export{b as d,y as i,v as p};
