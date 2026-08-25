(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------------------------------------------------
   HIRO / GitHub Pages safe runtime
   No external JS dependency. No loader. Native cursor.
--------------------------------------------------------- */

/* Remove the old loader and custom cursor from the DOM. */
document.body.classList.remove('is-loading');
$('#page-loader')?.remove();
$('.custom-cursor')?.remove();
$$('.cursor-trail').forEach(el => el.remove());

/* Runtime styles: these override the old inline CSS without
   requiring a build system, so GitHub Pages serves them directly. */
const style = document.createElement('style');
style.textContent = `
  html { scroll-behavior: auto !important; }
  body, body * { cursor: auto !important; }

  .page-loader,
  .loader-grid,
  .loader-noise,
  .loader-frame,
  .loader-head,
  .loader-foot,
  .loader-content,
  .loader-orbit,
  .loader-wave { display: none !important; }

  /* Scroll reveal: blur -> sharp + depth. */
  .hiro-scroll {
    opacity: 0;
    filter: blur(14px);
    transform: translate3d(0, 55px, 0) scale(.975);
    transition:
      opacity .9s cubic-bezier(.16,1,.3,1),
      filter 1s cubic-bezier(.16,1,.3,1),
      transform 1s cubic-bezier(.16,1,.3,1);
    will-change: opacity, filter, transform;
  }

  .hiro-scroll.hiro-visible {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0,0,0) scale(1);
  }

  .hiro-scroll[data-delay="1"] { transition-delay: .08s; }
  .hiro-scroll[data-delay="2"] { transition-delay: .16s; }
  .hiro-scroll[data-delay="3"] { transition-delay: .24s; }

  /* Persistent navbar + live depth while scrolling. */
  .navbar {
    position: fixed !important;
    top: 0 !important;
    z-index: 5000 !important;
    transition: box-shadow .35s ease, background .35s ease, backdrop-filter .35s ease;
  }

  .navbar.hiro-scrolled {
    background: rgba(255,255,255,.82) !important;
    box-shadow: 0 12px 38px rgba(16,24,40,.10);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
  }

  /* Interactive 3D cards. */
  .skill-card,
  .video-card,
  .review-card,
  .collab-card,
  .discord-button {
    transform-style: preserve-3d;
    will-change: transform;
  }

  .skill-card,
  .video-card,
  .review-card,
  .collab-card {
    transition:
      transform .18s cubic-bezier(.2,.8,.2,1),
      box-shadow .35s ease,
      border-color .35s ease;
  }

  /* Video thumbnail cards. */
  .hiro-video-link {
    position: absolute;
    inset: 0;
    display: block;
    overflow: hidden;
    background: #08111f;
  }

  .hiro-video-link img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.001);
    filter: saturate(.9) contrast(1.03);
    transition: transform .7s cubic-bezier(.16,1,.3,1), filter .5s ease;
  }

  .hiro-video-link::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(180deg, rgba(4,10,20,.02), rgba(4,10,20,.10) 42%, rgba(4,10,20,.72));
  }

  .hiro-video-link:hover img {
    transform: scale(1.08);
    filter: saturate(1.12) contrast(1.06);
  }

  .hiro-play {
    position: absolute;
    z-index: 3;
    left: 50%;
    top: 50%;
    width: 76px;
    height: 76px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255,255,255,.5);
    border-radius: 50%;
    background: rgba(255,255,255,.14);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    transform: translate(-50%,-50%);
    box-shadow: 0 18px 60px rgba(0,0,0,.28);
    transition: transform .35s cubic-bezier(.16,1,.3,1), background .35s ease, box-shadow .35s ease;
  }

  .hiro-play span {
    width: 0;
    height: 0;
    margin-left: 5px;
    border-top: 9px solid transparent;
    border-bottom: 9px solid transparent;
    border-left: 14px solid #fff;
  }

  .hiro-video-link:hover .hiro-play {
    transform: translate(-50%,-50%) scale(1.13);
    background: rgba(22,119,255,.82);
    box-shadow: 0 20px 70px rgba(22,119,255,.38), 0 0 0 14px rgba(22,119,255,.08);
  }

  .hiro-video-number {
    position: absolute;
    z-index: 3;
    left: 20px;
    bottom: 17px;
    color: #fff;
    font: 500 11px/1 'DM Mono', monospace;
    letter-spacing: .18em;
  }

  /* Link destination preview next to the pointer. */
  #hiro-link-preview {
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    opacity: 0;
    transform: translate3d(14px,14px,0) scale(.92);
    padding: 8px 11px;
    border: 1px solid rgba(22,119,255,.18);
    border-radius: 9px;
    background: rgba(255,255,255,.86);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 12px 35px rgba(16,24,40,.12);
    color: #1677ff;
    font: 600 9px/1 'DM Mono', monospace;
    letter-spacing: .12em;
    text-transform: uppercase;
    transition: opacity .16s ease, transform .16s ease;
  }

  #hiro-link-preview.visible {
    opacity: 1;
    transform: translate3d(14px,14px,0) scale(1);
  }

  @media (max-width: 700px), (pointer: coarse) {
    .hiro-scroll { filter: none; transform: translateY(28px); }
    #hiro-link-preview { display: none; }
    .hiro-play { width: 60px; height: 60px; }
    .hiro-play span { border-top-width: 7px; border-bottom-width: 7px; border-left-width: 11px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .hiro-scroll { opacity: 1 !important; filter: none !important; transform: none !important; transition: none !important; }
    *, *::before, *::after { animation-duration: .001ms !important; }
  }
`;
document.head.append(style);

/* ---------------------------------------------------------
   Navbar
--------------------------------------------------------- */
const header = $('.navbar');
const menu = $('.menu-toggle');
const nav = $('.nav-links');

const updateHeader = () => {
  document.documentElement.style.setProperty('--header-height', `${header?.offsetHeight || 70}px`);
  header?.classList.toggle('hiro-scrolled', window.scrollY > 18);
};
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });
window.addEventListener('resize', updateHeader, { passive: true });

menu?.addEventListener('click', () => {
  const open = nav?.classList.toggle('active') ?? false;
  menu.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    nav.classList.remove('active');
    menu?.setAttribute('aria-expanded', 'false');
    const y = target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 70);
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  });
});

/* ---------------------------------------------------------
   Scroll reveal with real IntersectionObserver
--------------------------------------------------------- */
const revealItems = $$('.reveal');
revealItems.forEach((element, index) => {
  element.classList.remove('visible');
  element.classList.add('hiro-scroll');
  element.dataset.delay = String(Math.min(index % 4, 3));
});

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('hiro-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12, rootMargin: '0px 0px -8% 0px' });

revealItems.forEach(element => revealObserver.observe(element));

/* ---------------------------------------------------------
   Hover destination preview
--------------------------------------------------------- */
const preview = document.createElement('div');
preview.id = 'hiro-link-preview';
document.body.append(preview);
let pointerX = 0;
let pointerY = 0;

window.addEventListener('pointermove', event => {
  pointerX = event.clientX;
  pointerY = event.clientY;
  preview.style.left = `${pointerX}px`;
  preview.style.top = `${pointerY}px`;
}, { passive: true });

const destinationLabel = element => {
  const href = element.getAttribute('href') || '';
  const text = element.textContent.trim().replace(/\s+/g, ' ');
  if (href.startsWith('#')) return `SECTION · ${href.slice(1).toUpperCase()}`;
  if (href.includes('youtube.com') || href.includes('youtu.be')) return 'YOUTUBE · OUVRIR';
  if (href.includes('discord')) return 'DISCORD · REJOINDRE';
  if (href.startsWith('mailto:')) return 'EMAIL · CONTACTER';
  if (href.startsWith('http')) return `LIEN · ${text || 'OUVRIR'}`;
  return text ? `OUVRIR · ${text.toUpperCase()}` : 'OUVRIR';
};

$$('a, button').forEach(element => {
  element.addEventListener('pointerenter', () => {
    if (matchMedia('(pointer: coarse)').matches) return;
    preview.textContent = destinationLabel(element);
    preview.classList.add('visible');
  });
  element.addEventListener('pointerleave', () => preview.classList.remove('visible'));
});

/* ---------------------------------------------------------
   Video thumbnails -> new YouTube tab
--------------------------------------------------------- */
const videoIds = ['B3k-fNQCcLQ', 'Rvlx9754160', 'JHUjIM5g1JU', 'GyRl4ynlEXQ'];

$$('.video-wrapper').forEach((wrapper, index) => {
  const iframe = $('iframe', wrapper);
  const embedded = iframe?.src.match(/embed\/([^?&#/]+)/)?.[1];
  const id = embedded || videoIds[index];
  if (!id) return;

  const link = document.createElement('a');
  link.className = 'hiro-video-link';
  link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Ouvrir la vidéo ${index + 1} sur YouTube`);

  const image = document.createElement('img');
  image.alt = `Miniature de la réalisation vidéo ${index + 1}`;
  image.loading = index < 2 ? 'eager' : 'lazy';
  image.decoding = 'async';
  image.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  image.onerror = () => {
    if (!image.src.includes('hqdefault.jpg')) image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  };

  const play = document.createElement('span');
  play.className = 'hiro-play';
  play.innerHTML = '<span aria-hidden="true"></span>';

  const number = document.createElement('span');
  number.className = 'hiro-video-number';
  number.textContent = `0${index + 1}`;

  link.append(image, play, number);
  wrapper.replaceChildren(link);
});

/* ---------------------------------------------------------
   Lightweight procedural 3D background - Canvas only
--------------------------------------------------------- */
const canvas = document.createElement('canvas');
canvas.id = 'hiro-3d';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);
const ctx = canvas.getContext('2d', { alpha: true });

if (ctx) {
  let W = 0, H = 0, DPR = 1, time = 0;
  let mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  let scrollDepth = 0;

  const resize = () => {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => { scrollDepth = window.scrollY; }, { passive: true });
  window.addEventListener('pointermove', event => {
    targetX = event.clientX / Math.max(W, 1) * 2 - 1;
    targetY = event.clientY / Math.max(H, 1) * 2 - 1;
  }, { passive: true });

  const particles = Array.from({ length: 190 }, () => ({
    x: (Math.random() - .5) * 80,
    y: (Math.random() - .5) * 52,
    z: Math.random() * 80 + 2,
    speed: Math.random() * .018 + .006,
    size: Math.random() * 1.7 + .35,
    phase: Math.random() * Math.PI * 2
  }));

  const project = (x, y, z) => {
    const focal = Math.min(W, H) * .72;
    const scale = focal / Math.max(2.5, z);
    return { x: W / 2 + x * scale, y: H / 2 + y * scale, scale };
  };

  const glow = (x, y, radius, alpha) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(22,119,255,${alpha})`);
    gradient.addColorStop(1, 'rgba(22,119,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const ellipse = (x, y, rx, ry, rotation, alpha) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.strokeStyle = `rgba(22,119,255,${alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const draw = () => {
    time += .016;
    mouseX += (targetX - mouseX) * .045;
    mouseY += (targetY - mouseY) * .045;
    ctx.clearRect(0, 0, W, H);

    glow(W * (.5 + mouseX * .08), H * (.42 + mouseY * .05), Math.min(W, H) * .46, .045);

    /* Moving depth rings. */
    for (let i = 0; i < 15; i++) {
      const z = (i * 6.3 + time * 4.5 + scrollDepth * .008) % 86 + 3;
      const p = project(mouseX * 7, mouseY * 4, z);
      const radius = Math.min(W, H) * .013 * p.scale + i * 6;
      ellipse(p.x, p.y, radius * 2.1, radius * .46, Math.sin(time * .4 + i) * .32 + mouseY * .2, .018 + (15 - i) * .0025);
    }

    /* Perspective floor. */
    ctx.save();
    ctx.translate(W / 2 + mouseX * 20, H * .56 + mouseY * 9);
    ctx.strokeStyle = 'rgba(22,119,255,.035)';
    for (let i = -15; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 70, 0);
      ctx.lineTo(i * 420, H * .72);
      ctx.stroke();
    }
    for (let i = 1; i < 15; i++) {
      const y = Math.pow(i / 14, 1.72) * H * .72;
      ctx.beginPath();
      ctx.moveTo(-W * .75, y);
      ctx.lineTo(W * .75, y);
      ctx.stroke();
    }
    ctx.restore();

    /* Forward-moving particles. */
    for (const particle of particles) {
      particle.z -= particle.speed * 4.6;
      if (particle.z < 2) {
        particle.z = 80;
        particle.x = (Math.random() - .5) * 80;
        particle.y = (Math.random() - .5) * 52;
      }

      const p = project(
        particle.x + mouseX * particle.z * .025 + Math.sin(time * .45 + particle.phase) * .45,
        particle.y + mouseY * particle.z * .02 + Math.cos(time * .35 + particle.phase) * .35,
        particle.z
      );

      const radius = Math.max(.35, particle.size * p.scale * .035);
      ctx.fillStyle = `rgba(22,119,255,${Math.min(.3, .018 + p.scale * .018)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Central orbital focus. */
    const cx = W / 2 + mouseX * 25;
    const cy = H * .48 + mouseY * 15;
    const pulse = 1 + Math.sin(time * 1.4) * .035;
    ellipse(cx, cy, 110 * pulse, 35 * pulse, time * .12, .055);
    ellipse(cx, cy, 180 * pulse, 55 * pulse, -time * .08, .028);

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
}

})();