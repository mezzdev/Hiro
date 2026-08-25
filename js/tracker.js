const TRACK_ENDPOINT = '/api/visit';
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

    return { page: window.location.pathname, browser, os, resolution: `${window.innerWidth}x${window.innerHeight}`, language: navigator.language, referrer: document.referrer || 'Direct', date: new Date().toISOString() };
}

async function trackVisit() {
    if (sessionStorage.getItem(TRACKED_KEY)) return;
    try {
        const response = await fetch(TRACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getVisitorInfo()), keepalive: true, credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Tracker HTTP ${response.status}`);
        sessionStorage.setItem(TRACKED_KEY, '1');
    } catch (error) { console.warn('Tracker indisponible :', error); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackVisit, { once: true });
else trackVisit();

// Load the cinematic 3D experience after the tracker has been scheduled.
const experience = document.createElement('script');
experience.src = '/js/experience.js';
experience.defer = true;
document.head.appendChild(experience);
