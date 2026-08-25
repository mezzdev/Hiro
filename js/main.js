const header = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const revealElements = document.querySelectorAll('.reveal');

const updateScrollOffset = () => {
    document.documentElement.style.setProperty(
        '--header-height',
        `${header?.offsetHeight || 70}px`
    );
};

updateScrollOffset();
window.addEventListener('resize', updateScrollOffset, { passive: true });

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        });
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
);

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

        window.scrollTo({
            top: Math.max(0, top),
            behavior: 'smooth'
        });

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
