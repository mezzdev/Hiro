const TRACKED_KEY = 'hiro_visit_tracked';

function getVisitorInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Inconnu';

    if (userAgent.includes('Edg/')) browser = 'Microsoft Edge';
    else if (userAgent.includes('OPR/') || userAgent.includes('Opera')) browser = 'Opera';
    else if (userAgent.includes('Vivaldi/')) browser = 'Vivaldi';
    else if (userAgent.includes('SamsungBrowser/')) browser = 'Samsung Internet';
    else if (userAgent.includes('Firefox/')) browser = 'Mozilla Firefox';
    else if (userAgent.includes('CriOS/')) browser = 'Chrome iOS';
    else if (userAgent.includes('FxiOS/')) browser = 'Firefox iOS';
    else if (userAgent.includes('Chrome/')) browser = 'Google Chrome';
    else if (userAgent.includes('Safari/')) browser = 'Safari';

    let os = 'Inconnu';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';

    return {
        page: window.location.pathname,
        browser,
        os,
        resolution: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        referrer: document.referrer || 'Direct',
        date: new Date().toISOString()
    };
}

async function trackVisit() {
    // GitHub Pages is static: there is no /api/visit endpoint here.
    // Skip the request instead of generating a 404/error in the console.
    if (window.location.hostname.endsWith('github.io')) return;
    if (sessionStorage.getItem(TRACKED_KEY)) return;

    const endpoint = './api/visit';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getVisitorInfo()),
            keepalive: true,
            credentials: 'same-origin'
        });

        if (!response.ok) throw new Error(`Tracker HTTP ${response.status}`);
        sessionStorage.setItem(TRACKED_KEY, '1');
    } catch (error) {
        console.warn('Tracker indisponible :', error);
    }
}

function setupVideoThumbnails() {
    const cards = document.querySelectorAll('.video-card');

    cards.forEach(card => {
        const iframe = card.querySelector('iframe');
        if (!iframe) return;

        const match = iframe.src.match(/youtube\.com\/embed\/([^?&/]+)/i);
        if (!match) return;

        const videoId = match[1];
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const title = iframe.getAttribute('title') || 'Voir la vidéo';

        const link = document.createElement('a');
        link.className = 'video-thumbnail-link';
        link.href = videoUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `Ouvrir la vidéo : ${title}`);

        const image = document.createElement('img');
        image.className = 'video-thumbnail';
        image.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        image.alt = title;
        image.loading = 'lazy';
        image.decoding = 'async';

        image.addEventListener('error', () => {
            if (!image.src.includes('/hqdefault.jpg')) {
                image.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        }, { once: true });

        const play = document.createElement('span');
        play.className = 'video-thumbnail-play';
        play.setAttribute('aria-hidden', 'true');
        play.innerHTML = '<span></span>';

        const label = document.createElement('span');
        label.className = 'video-thumbnail-label';
        label.textContent = 'OUVRIR LA VIDÉO';

        link.append(image, play, label);
        iframe.replaceWith(link);

        const wrapper = card.querySelector('.video-wrapper');
        if (wrapper) wrapper.classList.add('has-thumbnail');
    });

    if (!document.getElementById('video-thumbnail-styles')) {
        const style = document.createElement('style');
        style.id = 'video-thumbnail-styles';
        style.textContent = `
            .video-wrapper.has-thumbnail {
                position: relative;
                overflow: hidden;
            }

            .video-thumbnail-link {
                position: relative;
                display: block;
                width: 100%;
                aspect-ratio: 16 / 9;
                overflow: hidden;
                background: #101828;
                text-decoration: none;
                cursor: pointer;
            }

            .video-thumbnail {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform .45s cubic-bezier(.16,1,.3,1), filter .45s ease;
            }

            .video-thumbnail-link::after {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(16,24,40,.02), rgba(16,24,40,.48));
                transition: background .3s ease;
            }

            .video-thumbnail-play {
                position: absolute;
                z-index: 2;
                left: 50%;
                top: 50%;
                width: 58px;
                height: 58px;
                display: grid;
                place-items: center;
                transform: translate(-50%, -50%);
                border: 1px solid rgba(255,255,255,.7);
                border-radius: 50%;
                background: rgba(255,255,255,.16);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                box-shadow: 0 12px 35px rgba(0,0,0,.18);
                transition: transform .3s ease, background .3s ease;
            }

            .video-thumbnail-play span {
                width: 0;
                height: 0;
                margin-left: 4px;
                border-top: 8px solid transparent;
                border-bottom: 8px solid transparent;
                border-left: 12px solid #fff;
            }

            .video-thumbnail-label {
                position: absolute;
                z-index: 3;
                left: 18px;
                bottom: 16px;
                font: 500 9px 'DM Mono', monospace;
                letter-spacing: .13em;
                color: #fff;
                opacity: .9;
            }

            .video-thumbnail-link:hover .video-thumbnail {
                transform: scale(1.045);
                filter: brightness(1.08);
            }

            .video-thumbnail-link:hover::after {
                background: linear-gradient(180deg, rgba(22,119,255,.02), rgba(16,24,40,.38));
            }

            .video-thumbnail-link:hover .video-thumbnail-play {
                transform: translate(-50%, -50%) scale(1.12);
                background: rgba(22,119,255,.72);
            }

            @media (max-width: 700px) {
                .video-thumbnail-play {
                    width: 50px;
                    height: 50px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function loadOptionalScripts() {
    const scripts = ['./js/experience.js', './js/vehicle.js'];

    scripts.forEach(src => {
        if (document.querySelector(`script[src="${src}"]`)) return;

        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onerror = () => console.warn(`Script indisponible : ${src}`);
        document.head.appendChild(script);
    });
}

function initHiro() {
    setupVideoThumbnails();
    loadOptionalScripts();
    trackVisit();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHiro, { once: true });
} else {
    initHiro();
}
