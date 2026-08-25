(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(pointer:fine)').matches;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const header = $('.navbar'), menu = $('.menu-toggle'), nav = $('.nav-links');
  const loader = $('#page-loader'), bar = $('#loader-bar'), percent = $('#loader-percent');
  const status = $('#loader-status'), detail = $('#loader-detail'), log = $('#loader-log'), cursor = $('.custom-cursor');

  const setHeader = () => document.documentElement.style.setProperty('--header-height', `${header?.offsetHeight || 70}px`);
  setHeader();
  addEventListener('resize', setHeader, { passive: true });

  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('active') || false;
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    nav.classList.remove('active');
    menu?.setAttribute('aria-expanded', 'false');
    scrollTo(0, Math.max(0, target.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 70)));
  }));

  const css = document.createElement('style');
  css.textContent = `
    .three-scene{position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;opacity:.72}
    .three-scene canvas{display:block;width:100%;height:100%}
    .three-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 45%,transparent 20%,rgba(255,255,255,.2) 72%,rgba(255,255,255,.55))}
    .hiro-depth{transform-style:preserve-3d;backface-visibility:hidden;will-change:transform}
    .video-wrapper{transform:translateZ(34px);transform-style:preserve-3d;backface-visibility:hidden}
    .video-card,.skill-card,.review-card,.collab-card,.discord-button{transform-style:preserve-3d;backface-visibility:hidden;transition:none!important}
    .custom-cursor,.custom-cursor:before,.custom-cursor:after{transition:none!important}
    body.section-transition,body.section-arrived{animation:none!important}
    @media(pointer:coarse){.three-scene{opacity:.28}.hiro-depth{transform:none!important}}
    @media(prefers-reduced-motion:reduce){.three-scene{display:none!important}}
  `;
  document.head.append(css);
  $$('.reveal').forEach(el => el.classList.add('visible'));

  /* Load the other local JS files explicitly with GitHub-Pages-safe relative URLs. */
  const loadLocalScript = path => new Promise(resolve => {
    const url = new URL(path, document.baseURI).href;
    if ([...document.scripts].some(s => s.src === url)) return resolve(true);
    const s = document.createElement('script');
    s.src = url;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.append(s);
  });

  async function loadThree() {
    if (window.THREE) return window.THREE;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js';
    script.dataset.hiroThree = 'true';
    script.async = true;
    document.head.append(script);
    return new Promise((resolve, reject) => {
      script.addEventListener('load', () => window.THREE ? resolve(window.THREE) : reject(), { once: true });
      script.addEventListener('error', reject, { once: true });
    });
  }

  function initCursor() {
    if (!cursor || !fine || reduced) return;
    document.body.classList.add('cursor-ready');
    addEventListener('mousemove', e => { cursor.style.opacity = '1'; cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`; }, { passive: true });
    document.addEventListener('mouseover', e => { if (e.target.closest('a,button,iframe,.video-card,.skill-card,.review-card,.collab-card')) cursor.classList.add('active'); });
    document.addEventListener('mouseout', e => { if (e.target.closest('a,button,iframe,.video-card,.skill-card,.review-card,.collab-card')) cursor.classList.remove('active'); });
  }

  function initDepth() {
    if (!fine || reduced) return;
    const items = $$('.hero-content,.section-container,.skill-card,.video-card,.review-card,.collab-card,.discord-button');
    const update = () => {
      const h = innerHeight;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.max(-1, Math.min(1, (r.top + r.height / 2 - h / 2) / (h * .8)));
        const z = (1 - Math.abs(d)) * 80 + (i % 3) * 10;
        el.classList.add('hiro-depth');
        el.style.transform = `translate3d(0,${-d * 24}px,${z}px) rotateX(${-d * 3.5}deg) rotateY(${d * 2.5}deg)`;
      });
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  async function initThree() {
    if (!fine || reduced || $('.three-scene')) return;
    let THREE;
    try { THREE = await loadThree(); } catch (_) { return; }

    const host = document.createElement('div'); host.className = 'three-scene'; host.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas'); host.append(canvas);
    const vignette = document.createElement('div'); vignette.className = 'three-vignette'; host.append(vignette); document.body.prepend(host);

    const scene = new THREE.Scene(); scene.fog = new THREE.FogExp2(0xf7f9fc, .011);
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, .1, 240); camera.position.set(0, 0, 32);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.setSize(innerWidth, innerHeight, false); renderer.outputColorSpace = THREE.SRGBColorSpace;
    const world = new THREE.Group(); scene.add(world);

    /* Procedural 3D world: particles, depth grid, orbital rings and wire geometry. No models. */
    const count = Math.min(2200, Math.max(900, Math.floor(innerWidth * innerHeight / 800)));
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { const p=i*3,a=Math.random()*Math.PI*2,r=7+Math.pow(Math.random(),.62)*48; pos[p]=Math.cos(a)*r; pos[p+1]=(Math.random()-.5)*52; pos[p+2]=(Math.random()-.5)*86; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    world.add(new THREE.Points(pg, new THREE.PointsMaterial({ color:0x1677ff,size:.052,transparent:true,opacity:.46,depthWrite:false,sizeAttenuation:true })));

    const grid = new THREE.GridHelper(180, 90, 0x1677ff, 0xcbd9e8); grid.rotation.x=Math.PI/2; grid.position.z=-42; grid.material.transparent=true; grid.material.opacity=.065; world.add(grid);
    const orbital = new THREE.Group(); world.add(orbital);
    for (let i=0;i<14;i++) { const ring=new THREE.Mesh(new THREE.TorusGeometry(3+i*1.8,.009+i*.001,8,128),new THREE.MeshBasicMaterial({color:0x1677ff,transparent:true,opacity:Math.max(.018,.085-i*.004)})); ring.position.set((i%4-1.5)*7,(Math.floor(i/4)-1.5)*6,-8-i*2.7); ring.rotation.set(i*.23,i*.31,i*.17); orbital.add(ring); }
    const lattice = new THREE.Group(); world.add(lattice);
    for (let i=0;i<10;i++) { const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(1.3+i*.65,1),new THREE.MeshBasicMaterial({color:0x1677ff,wireframe:true,transparent:true,opacity:.035})); mesh.position.set(Math.sin(i*1.71)*13,Math.cos(i*1.19)*10,-10-i*4.5); mesh.rotation.set(i*.37,i*.22,i*.13); lattice.add(mesh); }

    const pointer={x:0,y:0}; let scroll=0;
    addEventListener('mousemove',e=>{pointer.x=e.clientX/innerWidth*2-1;pointer.y=e.clientY/innerHeight*2-1},{passive:true});
    addEventListener('scroll',()=>{scroll=scrollY},{passive:true});
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(innerWidth,innerHeight,false)},{passive:true});
    let last=performance.now();
    const render=now=>{const dt=Math.min(.04,(now-last)/1000);last=now;camera.position.x=pointer.x*2.8;camera.position.y=-pointer.y*1.8-scroll*.0015;camera.position.z=31+Math.sin(scroll*.0009)*2;camera.rotation.x=-pointer.y*.025;camera.rotation.y=pointer.x*.04;world.rotation.y+=dt*.012+pointer.x*.0007;world.rotation.x=pointer.y*-.025;orbital.rotation.z+=dt*.008;lattice.rotation.y-=dt*.006;renderer.render(scene,camera);requestAnimationFrame(render)};
    requestAnimationFrame(render);
  }

  async function startLoader() {
    if (!loader) return;
    const started=performance.now();
    const set=n=>{const p=Math.round(n);if(bar)bar.style.width=`${p}%`;if(percent)percent.textContent=`${p}%`;};
    const add=text=>{if(!log)return;const s=document.createElement('span');s.textContent=`› ${text}`;log.append(s);while(log.children.length>5)log.firstElementChild.remove();};
    add('document');set(12);
    await Promise.all($$('img').map(img=>img.complete?Promise.resolve():new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});})));
    set(42);if(status)status.textContent='MÉDIAS PRÊTS';if(detail)detail.textContent='Ressources vérifiées';add('images');
    try{await document.fonts.ready}catch(_){} set(62);add('polices');
    initCursor();initDepth();set(75);add('profondeur 3D');
    const files=await Promise.all([loadLocalScript('./js/experience.js'),loadLocalScript('./js/vehicle.js')]);
    set(84);add(files.every(Boolean)?'scripts locaux OK':'scripts locaux vérifiés');
    await initThree();set(100);if(status)status.textContent='BIENVENUE';if(detail)detail.textContent='Rendu prêt';add('site prêt');
    while(performance.now()-started<700)await new Promise(requestAnimationFrame);
    document.body.classList.remove('is-loading');loader.classList.add('loaded');
  }

  startLoader().catch(()=>{document.body.classList.remove('is-loading');loader?.classList.add('loaded');});
})();
