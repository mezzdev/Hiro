(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = window.matchMedia('(pointer:fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  const loader = $('#page-loader');
  const bar = $('#loader-bar');
  const percent = $('#loader-percent');
  const status = $('#loader-status');
  const detail = $('#loader-detail');
  const log = $('#loader-log');
  const cursor = $('.custom-cursor');
  const header = $('.navbar');
  const menu = $('.menu-toggle');
  const nav = $('.nav-links');

  const setHeader = () => {
    document.documentElement.style.setProperty('--header-height', `${header?.offsetHeight || 70}px`);
  };
  setHeader();
  window.addEventListener('resize', setHeader, { passive: true });

  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('active') || false;
    menu.setAttribute('aria-expanded', String(open));
  });

  nav?.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    nav.classList.remove('active');
    menu?.setAttribute('aria-expanded', 'false');
    window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 70)));
  }));

  /* Make the existing site visible immediately. The old reveal system was leaving
     every .reveal element at opacity:0 because no observer was attached. */
  const revealStyle = document.createElement('style');
  revealStyle.textContent = `
    .reveal, .reveal.visible { opacity: 1 !important; transform: none !important; }
    .three-scene { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; opacity: .55; }
    .three-scene canvas { display: block; width: 100%; height: 100%; }
    .three-vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at 50% 45%, transparent 18%, rgba(255,255,255,.12) 72%, rgba(255,255,255,.42)); }
    .hero, .section, .footer { position: relative; z-index: 1; }
    .navbar { z-index: 1000; }
    .hiro-depth { transform-style: preserve-3d; backface-visibility: hidden; }
    .video-wrapper { transform: translateZ(28px); transform-style: preserve-3d; }
    .video-card, .skill-card, .review-card, .collab-card, .discord-button { transform-style: preserve-3d; backface-visibility: hidden; transition: none !important; }
    body.section-transition, body.section-arrived { animation: none !important; }
    @media(pointer:coarse){ .three-scene{opacity:.18} .hiro-depth{transform:none!important} }
    @media(prefers-reduced-motion:reduce){ .three-scene{display:none!important} }
  `;
  document.head.append(revealStyle);

  const waitForCriticalImages = () => Promise.all(
    $$('img:not([loading="lazy"])').map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 1200);
      });
    })
  );

  const loadLocalScript = path => new Promise(resolve => {
    const url = new URL(path, document.baseURI).href;
    if ([...document.scripts].some(s => s.src === url)) return resolve(true);
    const script = document.createElement('script');
    script.src = url;
    script.async = false;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.append(script);
    setTimeout(() => resolve(false), 1800);
  });

  const loadThree = () => {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js';
      script.async = true;
      script.onload = () => window.THREE ? resolve(window.THREE) : reject(new Error('Three.js unavailable'));
      script.onerror = () => reject(new Error('Three.js failed'));
      document.head.append(script);
      setTimeout(() => reject(new Error('Three.js timeout')), 2800);
    });
  };

  function initCursor() {
    if (!cursor || !fine || reduced) return;
    document.body.classList.add('cursor-ready');
    window.addEventListener('mousemove', event => {
      cursor.style.opacity = '1';
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    }, { passive: true });
    document.addEventListener('mouseover', event => {
      if (event.target.closest('a,button,iframe,.video-card,.skill-card,.review-card,.collab-card')) cursor.classList.add('active');
    });
    document.addEventListener('mouseout', event => {
      if (event.target.closest('a,button,iframe,.video-card,.skill-card,.review-card,.collab-card')) cursor.classList.remove('active');
    });
  }

  function initDepth() {
    if (!fine || reduced) return;
    const items = $$('.hero-content,.section-container,.skill-card,.video-card,.review-card,.collab-card,.discord-button');
    let scheduled = false;
    const update = () => {
      scheduled = false;
      const h = innerHeight;
      items.forEach((el, index) => {
        const r = el.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.top + r.height / 2 - h / 2) / (h * .8)));
        const z = (1 - Math.abs(d)) * 28 + (index % 3) * 5;
        el.classList.add('hiro-depth');
        el.style.transform = `translate3d(0,${-d * 10}px,${z}px) rotateX(${-d * 1.5}deg) rotateY(${d * 1.2}deg)`;
      });
    };
    const request = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    request();
  }

  async function initThree() {
    if (!fine || reduced || $('.three-scene')) return false;
    let THREE;
    try { THREE = await loadThree(); } catch (_) { return false; }

    const host = document.createElement('div');
    host.className = 'three-scene';
    host.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    host.append(canvas);
    const vignette = document.createElement('div');
    vignette.className = 'three-vignette';
    host.append(vignette);
    document.body.prepend(host);

    try {
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0xf7f9fc, 0.011);
      const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, .1, 240);
      camera.position.set(0, 0, 32);
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const world = new THREE.Group();
      scene.add(world);

      const count = Math.min(1500, Math.max(600, Math.floor(innerWidth * innerHeight / 1300)));
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const p = i * 3;
        const a = Math.random() * Math.PI * 2;
        const r = 7 + Math.pow(Math.random(), .62) * 48;
        positions[p] = Math.cos(a) * r;
        positions[p + 1] = (Math.random() - .5) * 52;
        positions[p + 2] = (Math.random() - .5) * 86;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      world.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x1677ff, size: .052, transparent: true, opacity: .4, depthWrite: false })));

      const grid = new THREE.GridHelper(180, 90, 0x1677ff, 0xcbd9e8);
      grid.rotation.x = Math.PI / 2;
      grid.position.z = -42;
      grid.material.transparent = true;
      grid.material.opacity = .055;
      world.add(grid);

      const rings = new THREE.Group();
      world.add(rings);
      for (let i = 0; i < 10; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(3 + i * 1.8, .01, 8, 80),
          new THREE.MeshBasicMaterial({ color: 0x1677ff, transparent: true, opacity: Math.max(.018, .065 - i * .004) })
        );
        ring.position.set((i % 4 - 1.5) * 7, (Math.floor(i / 4) - 1) * 6, -8 - i * 3);
        ring.rotation.set(i * .23, i * .31, i * .17);
        rings.add(ring);
      }

      const pointer = { x: 0, y: 0 };
      let scroll = window.scrollY;
      window.addEventListener('mousemove', e => {
        pointer.x = e.clientX / innerWidth * 2 - 1;
        pointer.y = e.clientY / innerHeight * 2 - 1;
      }, { passive: true });
      window.addEventListener('scroll', () => { scroll = window.scrollY; }, { passive: true });
      window.addEventListener('resize', () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
        renderer.setSize(innerWidth, innerHeight, false);
      }, { passive: true });

      let last = performance.now();
      const render = now => {
        const dt = Math.min(.04, (now - last) / 1000);
        last = now;
        camera.position.x += (pointer.x * 2.8 - camera.position.x) * .035;
        camera.position.y += (-pointer.y * 1.8 - scroll * .001 - camera.position.y) * .025;
        camera.position.z += (31 + Math.sin(scroll * .0009) * 2 - camera.position.z) * .025;
        camera.rotation.x = -pointer.y * .025;
        camera.rotation.y = pointer.x * .04;
        world.rotation.y += dt * .012 + pointer.x * .0007;
        world.rotation.x = pointer.y * -.025;
        rings.rotation.z += dt * .008;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
      return true;
    } catch (error) {
      console.error('[Hiro] 3D disabled:', error);
      host.remove();
      return false;
    }
  }

  async function startLoader() {
    if (!loader) return;
    const started = performance.now();
    const setProgress = value => {
      const p = Math.max(0, Math.min(100, Math.round(value)));
      if (bar) bar.style.width = `${p}%`;
      if (percent) percent.textContent = `${p}%`;
    };
    const addLog = text => {
      if (!log) return;
      const line = document.createElement('span');
      line.textContent = `› ${text}`;
      log.append(line);
      while (log.children.length > 5) log.firstElementChild?.remove();
    };

    /* The actual page is already usable. The loader is only cosmetic. */
    setProgress(20); addLog('document');
    await waitForCriticalImages();
    setProgress(45); addLog('images');
    if (status) status.textContent = 'INTERFACE PRÊTE';
    if (detail) detail.textContent = 'Ressources vérifiées';

    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 500))]); } catch (_) {}
    setProgress(60); addLog('polices');

    initCursor();
    initDepth();
    setProgress(72); addLog('interface');

    /* These scripts are optional compatibility files. They must NEVER block the site. */
    await Promise.allSettled([
      loadLocalScript('./js/experience.js'),
      loadLocalScript('./js/vehicle.js')
    ]);
    setProgress(82); addLog('scripts vérifiés');

    if (status) status.textContent = 'RENDU 3D';
    await initThree();
    setProgress(100); addLog('site prêt');
    if (status) status.textContent = 'BIENVENUE';
    if (detail) detail.textContent = 'Site prêt';

    const remaining = Math.max(0, 500 - (performance.now() - started));
    await new Promise(resolve => setTimeout(resolve, remaining));
    document.body.classList.remove('is-loading');
    loader.classList.add('loaded');
  }

  /* Absolute safety net. Nothing can keep the visitor behind the loader. */
  const emergencyUnlock = setTimeout(() => {
    document.body.classList.remove('is-loading');
    loader?.classList.add('loaded');
  }, 5000);

  startLoader().catch(error => {
    console.error('[Hiro] startup:', error);
    document.body.classList.remove('is-loading');
    loader?.classList.add('loaded');
  }).finally(() => clearTimeout(emergencyUnlock));
})();
