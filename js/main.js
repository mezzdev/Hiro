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

  nav?.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      nav.classList.remove('active');
      menu?.setAttribute('aria-expanded', 'false');
      window.scrollTo(0, Math.max(0, target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 70)));
    });
  });

  /* No CSS transition is used for the 3D system. */
  const style = document.createElement('style');
  style.textContent = `
    .three-scene{position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;opacity:.7}
    .three-scene canvas{display:block;width:100%;height:100%}
    .three-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%,transparent 18%,rgba(255,255,255,.18) 72%,rgba(255,255,255,.5))}
    .hiro-depth{transform-style:preserve-3d;backface-visibility:hidden;will-change:transform}
    .video-wrapper{transform:translateZ(28px);transform-style:preserve-3d}
    .video-card,.skill-card,.review-card,.collab-card,.discord-button{transform-style:preserve-3d;backface-visibility:hidden;transition:none!important}
    .custom-cursor,.custom-cursor:before,.custom-cursor:after{transition:none!important}
    body.section-transition,body.section-arrived{animation:none!important}
    @media(pointer:coarse){.three-scene{opacity:.22}.hiro-depth{transform:none!important}}
    @media(prefers-reduced-motion:reduce){.three-scene{display:none!important}}
  `;
  document.head.append(style);

  /* Never wait for lazy images: they are intentionally loaded later by the browser. */
  const waitForCriticalImages = () => Promise.all(
    $$('img:not([loading="lazy"])').map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 1800);
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
    setTimeout(() => resolve(false), 2500);
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
      setTimeout(() => reject(new Error('Three.js timeout')), 3500);
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
        const z = (1 - Math.abs(d)) * 55 + (index % 3) * 7;
        el.classList.add('hiro-depth');
        el.style.transform = `translate3d(0,${-d * 18}px,${z}px) rotateX(${-d * 2.5}deg) rotateY(${d * 2}deg)`;
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
    try {
      THREE = await loadThree();
    } catch (_) {
      return false;
    }

    let renderer;
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
      const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 240);
      camera.position.set(0, 0, 32);
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(innerWidth, innerHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const world = new THREE.Group();
      scene.add(world);

      const count = Math.min(1800, Math.max(700, Math.floor(innerWidth * innerHeight / 1100)));
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const p = i * 3;
        const a = Math.random() * Math.PI * 2;
        const r = 7 + Math.pow(Math.random(), 0.62) * 48;
        positions[p] = Math.cos(a) * r;
        positions[p + 1] = (Math.random() - 0.5) * 52;
        positions[p + 2] = (Math.random() - 0.5) * 86;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      world.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x1677ff, size: 0.052, transparent: true, opacity: 0.44, depthWrite: false })));

      const grid = new THREE.GridHelper(180, 90, 0x1677ff, 0xcbd9e8);
      grid.rotation.x = Math.PI / 2;
      grid.position.z = -42;
      grid.material.transparent = true;
      grid.material.opacity = 0.06;
      world.add(grid);

      const rings = new THREE.Group();
      world.add(rings);
      for (let i = 0; i < 12; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(3 + i * 1.7, 0.01, 8, 96),
          new THREE.MeshBasicMaterial({ color: 0x1677ff, transparent: true, opacity: Math.max(0.018, 0.075 - i * 0.004) })
        );
        ring.position.set((i % 4 - 1.5) * 7, (Math.floor(i / 4) - 1.5) * 6, -8 - i * 2.8);
        ring.rotation.set(i * 0.23, i * 0.31, i * 0.17);
        rings.add(ring);
      }

      const wire = new THREE.Group();
      world.add(wire);
      for (let i = 0; i < 9; i++) {
        const shape = new THREE.Mesh(
          new THREE.IcosahedronGeometry(1.3 + i * 0.65, 1),
          new THREE.MeshBasicMaterial({ color: 0x1677ff, wireframe: true, transparent: true, opacity: 0.032 })
        );
        shape.position.set(Math.sin(i * 1.71) * 13, Math.cos(i * 1.19) * 10, -10 - i * 4.5);
        shape.rotation.set(i * 0.37, i * 0.22, i * 0.13);
        wire.add(shape);
      }

      const pointer = { x: 0, y: 0 };
      let scroll = window.scrollY;
      window.addEventListener('mousemove', e => {
        pointer.x = e.clientX / innerWidth * 2 - 1;
        pointer.y = e.clientY / innerHeight * 2 - 1;
      }, { passive: true });
      window.addEventListener('scroll', () => { scroll = window.scrollY; }, { passive: true });

      const resize = () => {
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setSize(innerWidth, innerHeight, false);
      };
      window.addEventListener('resize', resize, { passive: true });

      let last = performance.now();
      const render = now => {
        const dt = Math.min(0.04, (now - last) / 1000);
        last = now;
        camera.position.x += (pointer.x * 2.8 - camera.position.x) * 0.035;
        camera.position.y += (-pointer.y * 1.8 - scroll * 0.0015 - camera.position.y) * 0.025;
        camera.position.z += (31 + Math.sin(scroll * 0.0009) * 2 - camera.position.z) * 0.025;
        camera.rotation.x = -pointer.y * 0.025;
        camera.rotation.y = pointer.x * 0.04;
        world.rotation.y += dt * 0.012 + pointer.x * 0.0007;
        world.rotation.x = pointer.y * -0.025;
        rings.rotation.z += dt * 0.008;
        wire.rotation.y -= dt * 0.006;
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
      return true;
    } catch (_) {
      renderer?.dispose?.();
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

    setProgress(8); addLog('document');
    await waitForCriticalImages();
    setProgress(38); addLog('images');
    if (status) status.textContent = 'MÉDIAS PRÊTS';
    if (detail) detail.textContent = 'Ressources critiques vérifiées';

    try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]); } catch (_) {}
    setProgress(55); addLog('polices');

    initCursor();
    initDepth();
    setProgress(68); addLog('profondeur');

    const scripts = await Promise.all([
      loadLocalScript('./js/experience.js'),
      loadLocalScript('./js/vehicle.js')
    ]);
    setProgress(78); addLog(scripts.every(Boolean) ? 'scripts locaux OK' : 'scripts locaux indisponibles, site maintenu');

    if (status) status.textContent = 'RENDU 3D';
    await initThree();
    setProgress(92); addLog('3D');

    /* Hard safety net: the loader can NEVER trap the visitor. */
    setProgress(100);
    if (status) status.textContent = 'BIENVENUE';
    if (detail) detail.textContent = 'Site prêt';
    addLog('site prêt');

    const remaining = Math.max(0, 650 - (performance.now() - started));
    await new Promise(resolve => setTimeout(resolve, remaining));
    document.body.classList.remove('is-loading');
    loader.classList.add('loaded');
  }

  /* Absolute fallback: even if an unexpected browser error occurs, never leave the loader on screen. */
  const emergencyUnlock = setTimeout(() => {
    document.body.classList.remove('is-loading');
    loader?.classList.add('loaded');
  }, 7000);

  startLoader().catch(error => {
    console.error('[Hiro] loader:', error);
    document.body.classList.remove('is-loading');
    loader?.classList.add('loaded');
  }).finally(() => clearTimeout(emergencyUnlock));
})();
