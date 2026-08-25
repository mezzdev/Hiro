(() => {
  'use strict';

  const style = document.createElement('style');
  style.textContent = `
    /* Loader removed: the site starts immediately. */
    body.is-loading { overflow: auto !important; }
    #page-loader, .page-loader { display: none !important; }

    /* Native cursor: the custom cursor is completely disabled. */
    .custom-cursor, .cursor-trail { display: none !important; }
    body, body * { cursor: auto !important; }

    /* Keep the navbar visible during the entire scroll. */
    .navbar {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 5000 !important;
      transform: translateZ(0);
      will-change: backdrop-filter, box-shadow;
      transition: background-color .25s ease, box-shadow .25s ease !important;
    }
    .navbar.hiro-scrolled {
      background: rgba(255,255,255,.88) !important;
      box-shadow: 0 12px 35px rgba(16,24,40,.08);
    }

    /* Scroll reveal: opacity + blur + depth. */
    .hiro-reveal {
      opacity: 0;
      filter: blur(18px);
      transform: translate3d(0, 55px, 0) scale(.97);
      transition:
        opacity .8s cubic-bezier(.16,1,.3,1),
        filter .8s cubic-bezier(.16,1,.3,1),
        transform .9s cubic-bezier(.16,1,.3,1);
      will-change: opacity, filter, transform;
    }
    .hiro-reveal.hiro-visible {
      opacity: 1;
      filter: blur(0);
      transform: translate3d(0,0,0) scale(1);
    }
    .hiro-reveal:nth-child(2) { transition-delay: .07s; }
    .hiro-reveal:nth-child(3) { transition-delay: .14s; }
    .hiro-reveal:nth-child(4) { transition-delay: .21s; }

    /* Interactive depth on cards. */
    .skill-card, .video-card, .review-card, .collab-card, .discord-button {
      --mx: 50%;
      --my: 50%;
    }
    .skill-card::after, .video-card::after, .review-card::after, .collab-card::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      background: radial-gradient(circle at var(--mx) var(--my), rgba(22,119,255,.11), transparent 38%);
      opacity: 0;
      transition: opacity .25s ease;
    }
    .skill-card:hover::after, .video-card:hover::after, .review-card:hover::after, .collab-card:hover::after { opacity: 1; }

    /* Link destination HUD. */
    #hiro-link-preview {
      position: fixed;
      z-index: 6000;
      left: 0;
      top: 0;
      max-width: min(420px, calc(100vw - 24px));
      padding: 9px 12px;
      border: 1px solid rgba(22,119,255,.16);
      border-radius: 9px;
      background: rgba(255,255,255,.9);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 12px 35px rgba(16,24,40,.12);
      color: #475467;
      font: 500 10px/1.3 "DM Mono", monospace;
      letter-spacing: .04em;
      pointer-events: none;
      opacity: 0;
      transform: translate3d(12px,12px,0) scale(.94);
      transition: opacity .14s ease, transform .14s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #hiro-link-preview.visible { opacity: 1; transform: translate3d(12px,12px,0) scale(1); }
    #hiro-link-preview strong { color: #1677ff; font-weight: 500; }

    /* No blur/animation for accessibility or touch devices. */
    @media (prefers-reduced-motion: reduce) {
      .hiro-reveal { opacity: 1 !important; filter: none !important; transform: none !important; transition: none !important; }
      #hiro-link-preview { transition: none; }
    }
    @media (pointer: coarse) {
      .hiro-reveal { opacity: 1; filter: none; transform: none; transition: none; }
      #hiro-link-preview { display: none; }
    }
  `;
  document.head.appendChild(style);

  document.body.classList.remove('is-loading');
  document.querySelector('#page-loader')?.remove();

  const navbar = document.querySelector('.navbar');
  const updateNavbar = () => navbar?.classList.toggle('hiro-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  const targets = [...document.querySelectorAll(
    '.section-container, .skill-card, .video-card, .review-card, .collab-card, .contact .section-container'
  )];
  targets.forEach(el => el.classList.add('hiro-reveal'));

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('hiro-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(el => observer.observe(el));
  } else {
    targets.forEach(el => el.classList.add('hiro-visible'));
  }

  const tiltTargets = [...document.querySelectorAll('.skill-card, .video-card, .review-card, .collab-card')];
  if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    tiltTargets.forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * 5;
        const ry = (x - 0.5) * 7;
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px) translateZ(8px)`;
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      }, { passive: true });
    });
  }

  const preview = document.createElement('div');
  preview.id = 'hiro-link-preview';
  preview.setAttribute('aria-hidden', 'true');
  document.body.appendChild(preview);

  const labelFor = link => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) return `SECTION · ${href.slice(1).toUpperCase()}`;
    if (href.startsWith('mailto:')) return `EMAIL · ${href.slice(7)}`;
    if (href.startsWith('tel:')) return `TEL · ${href.slice(4)}`;
    if (/youtube\.com|youtu\.be/.test(href)) return 'YOUTUBE · OUVRIR LA VIDÉO';
    try { return `OUVRIR · ${new URL(href, location.href).hostname}`; }
    catch { return 'OUVRIR LE LIEN'; }
  };

  document.addEventListener('pointerover', event => {
    const link = event.target.closest('a[href], button[data-href], [role="link"][data-href]');
    if (!link || !matchMedia('(pointer:fine)').matches) return;
    const href = link.getAttribute('href') || link.dataset.href || '';
    if (!href) return;
    preview.innerHTML = `<strong>↗</strong>&nbsp; ${labelFor(link)}`;
    preview.classList.add('visible');
  });

  document.addEventListener('pointerout', event => {
    const link = event.target.closest('a[href], button[data-href], [role="link"][data-href]');
    if (link && !link.contains(event.relatedTarget)) preview.classList.remove('visible');
  });

  document.addEventListener('pointermove', event => {
    if (!preview.classList.contains('visible')) return;
    const pad = 12;
    const x = Math.min(event.clientX, innerWidth - preview.offsetWidth - pad);
    const y = Math.min(event.clientY, innerHeight - preview.offsetHeight - pad);
    preview.style.left = `${Math.max(pad, x)}px`;
    preview.style.top = `${Math.max(pad, y)}px`;
  }, { passive: true });
})();
