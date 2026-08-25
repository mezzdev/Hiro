const header = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const revealElements = document.querySelectorAll('.reveal');
const loader = document.querySelector('#page-loader');
const loaderBar = document.querySelector('#loader-bar');
const loaderPercent = document.querySelector('#loader-percent');
const cursor = document.querySelector('.custom-cursor');

const updateScrollOffset = () => {
    document.documentElement.style.setProperty('--header-height', `${header?.offsetHeight || 70}px`);
};

updateScrollOffset();
window.addEventListener('resize', updateScrollOffset, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

revealElements.forEach((element) => revealObserver.observe(element));

const closeMenu = () => {
    navLinks?.classList.remove('active');
    menuToggle?.setAttribute('aria-expanded', 'false');
};

menuToggle?.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href');
        if (!targetId?.startsWith('#')) return;
        const target = document.querySelector(targetId);
        if (!target) return;

        event.preventDefault();
        closeMenu();
        const offset = header?.offsetHeight || 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        history.replaceState(null, '', targetId);
    });
});

document.addEventListener('click', (event) => {
    if (!navLinks?.classList.contains('active')) return;
    if (navLinks.contains(event.target) || menuToggle?.contains(event.target)) return;
    closeMenu();
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadSiteResources() {
    const resources = [
        './Hiro.png',
        './CubiGame.jpg',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap'
    ];

    let loaded = 0;
    const updateProgress = () => {
        loaded += 1;
        const percent = Math.min(96, Math.round((loaded / resources.length) * 96));
        if (loaderBar) loaderBar.style.width = `${percent}%`;
        if (loaderPercent) loaderPercent.textContent = `${percent}%`;
    };

    await Promise.all(resources.map((url) => new Promise((resolve) => {
        if (url.endsWith('.css')) {
            const link = document.querySelector(`link[href="${url}"]`);
            if (link?.sheet) {
                updateProgress();
                resolve();
                return;
            }
            const preload = document.createElement('link');
            preload.rel = 'preload';
            preload.as = 'style';
            preload.href = url;
            preload.onload = () => { updateProgress(); resolve(); };
            preload.onerror = () => { updateProgress(); resolve(); };
            document.head.appendChild(preload);
            return;
        }

        const image = new Image();
        image.onload = () => { updateProgress(); resolve(); };
        image.onerror = () => { updateProgress(); resolve(); };
        image.src = url;
    })));

    await Promise.race([
        document.fonts?.ready || Promise.resolve(),
        sleep(900)
    ]);

    if (loaderBar) loaderBar.style.width = '100%';
    if (loaderPercent) loaderPercent.textContent = '100%';
    await sleep(250);

    document.body.classList.remove('is-loading');
    loader?.classList.add('loaded');
}

if (loader) {
    loadSiteResources().catch(() => {
        document.body.classList.remove('is-loading');
        loader.classList.add('loaded');
    });
}

if (cursor && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = -100;
    let mouseY = -100;
    let currentX = mouseX;
    let currentY = mouseY;

    document.body.classList.add('cursor-ready');

    window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
        cursor.style.opacity = '1';
    }, { passive: true });

    const renderCursor = () => {
        currentX += (mouseX - currentX) * 0.22;
        currentY += (mouseY - currentY) * 0.22;
        cursor.style.left = `${currentX}px`;
        cursor.style.top = `${currentY}px`;
        requestAnimationFrame(renderCursor);
    };

    renderCursor();

    document.addEventListener('mouseover', (event) => {
        if (event.target.closest('a, button, iframe, .skill-card')) cursor.classList.add('active');
    });

    document.addEventListener('mouseout', (event) => {
        if (event.target.closest('a, button, iframe, .skill-card')) cursor.classList.remove('active');
    });
}
