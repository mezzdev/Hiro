(() => {
  const desktop = matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!desktop) return;

  const style = document.createElement('style');
  style.textContent = `
    .video-card,.video-wrapper{pointer-events:auto!important}
    .video-wrapper iframe{position:relative!important;z-index:20!important;display:block!important;pointer-events:auto!important}
    .cursor-label{display:none!important}
    .hiro-drive-hud{position:fixed;right:24px;bottom:24px;width:210px;height:150px;z-index:9000;border:1px solid rgba(22,119,255,.16);border-radius:18px;background:rgba(255,255,255,.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 18px 60px rgba(16,24,40,.12);overflow:hidden;pointer-events:none}
    .hiro-drive-hud canvas{width:100%;height:100%;display:block}
    .hiro-drive-info{position:absolute;left:12px;right:12px;bottom:9px;display:flex;justify-content:space-between;align-items:center;font:500 8px 'DM Mono',monospace;letter-spacing:.08em;color:#667085;text-transform:uppercase}
    .hiro-drive-info strong{color:#1677ff;font-weight:500}
    .hiro-drive-key{position:absolute;top:9px;right:12px;font:500 8px 'DM Mono',monospace;color:#98a2b3;letter-spacing:.08em}
    @media(max-width:800px){.hiro-drive-hud{display:none}}
  `;
  document.head.appendChild(style);

  const loadThree = () => window.THREE ? Promise.resolve(window.THREE) : new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.min.js';
    script.onload = () => resolve(window.THREE);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const sections = [
    { id: 'top', name: 'Accueil', x: 0, z: 0 },
    { id: 'services', name: 'Services', x: -7, z: -7 },
    { id: 'portfolio', name: 'Portfolio', x: 7, z: -14 },
    { id: 'reviews', name: 'Avis', x: -7, z: -21 },
    { id: 'collab', name: 'Collab', x: 7, z: -28 },
    { id: 'contact', name: 'Contact', x: 0, z: -35 }
  ];

  loadThree().then(THREE => {
    const hud = document.createElement('div');
    hud.className = 'hiro-drive-hud';
    hud.innerHTML = '<div class="hiro-drive-key">Z Q S D</div><div class="hiro-drive-info"><span id="drive-place">Accueil</span><strong>DRIVE MODE</strong></div>';
    const canvas = document.createElement('canvas');
    hud.prepend(canvas);
    document.body.appendChild(hud);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f9fc);
    scene.fog = new THREE.Fog(0xf7f9fc, 9, 35);

    const camera = new THREE.PerspectiveCamera(46, 1, .1, 80);
    camera.position.set(0, 5.5, 9);
    camera.lookAt(0, 0, -5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const world = new THREE.Group();
    scene.add(world);

    const ambient = new THREE.AmbientLight(0xffffff, 2.2);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0x1677ff, 2.8);
    key.position.set(-5, 9, 7);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .96 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.85;
    world.add(floor);

    const grid = new THREE.GridHelper(70, 35, 0x1677ff, 0xd9e3ef);
    grid.position.y = -.82;
    grid.material.transparent = true;
    grid.material.opacity = .18;
    world.add(grid);

    // Petite voiture low-poly construite uniquement avec des primitives Three.js.
    const car = new THREE.Group();
    car.position.set(0, -.25, 0);
    world.add(car);

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1677ff, metalness: .35, roughness: .3 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x101828, metalness: .15, roughness: .45 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: .78, metalness: .05, roughness: .15 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, .55, 4.1), bodyMat);
    body.position.y = .42;
    car.add(body);

    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.25, .22, 1.1), bodyMat);
    hood.position.set(0, .76, -1.35);
    car.add(hood);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.75, .65, 1.9), glassMat);
    cabin.position.set(0, .88, .25);
    car.add(cabin);

    const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.15, .2, .25), darkMat);
    bumper.position.set(0, .25, -2.05);
    car.add(bumper);

    const wheelGeo = new THREE.CylinderGeometry(.48, .48, .28, 16);
    const wheels = [];
    [[-1.28,.15,-1.28],[1.28,.15,-1.28],[-1.28,.15,1.28],[1.28,.15,1.28]].forEach(([x,y,z]) => {
      const w = new THREE.Mesh(wheelGeo, darkMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, y, z);
      car.add(w);
      wheels.push(w);
    });

    const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-.68, .68].forEach(x => {
      const light = new THREE.Mesh(new THREE.BoxGeometry(.42, .16, .12), headLightMat);
      light.position.set(x, .58, -2.08);
      car.add(light);
    });

    const portals = new THREE.Group();
    world.add(portals);
    sections.slice(1).forEach((point, i) => {
      const group = new THREE.Group();
      group.position.set(point.x, .9, point.z);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.55, .035, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x1677ff, transparent: true, opacity: .7 })
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(.05, 2.8, .05),
        new THREE.MeshBasicMaterial({ color: 0x1677ff, transparent: true, opacity: .28 })
      );
      pillar.position.y = 1;
      group.add(pillar);
      group.userData.section = point;
      portals.add(group);
    });

    const state = { x: 0, z: 0, vx: 0, vz: 0, yaw: 0, targetYaw: 0 };
    const keys = new Set();
    const keyMap = { z: 'forward', w: 'forward', s: 'back', q: 'left', a: 'left', d: 'right' };

    const drive = event => {
      const k = event.key.toLowerCase();
      if (!keyMap[k]) return;
      keys.add(keyMap[k]);
      event.preventDefault();
    };
    const release = event => {
      const k = event.key.toLowerCase();
      if (keyMap[k]) keys.delete(keyMap[k]);
    };
    addEventListener('keydown', drive);
    addEventListener('keyup', release);

    const nearestSection = () => {
      let best = sections[0], distance = Infinity;
      for (const section of sections) {
        const dx = state.x - section.x, dz = state.z - section.z;
        const d = dx * dx + dz * dz;
        if (d < distance) { distance = d; best = section; }
      }
      return { best, distance };
    };

    let lastSection = 'top';
    const drivePlace = hud.querySelector('#drive-place');
    let lastTime = performance.now();
    const resize = () => {
      const w = hud.clientWidth, h = hud.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    const animate = now => {
      const dt = Math.min(.035, (now - lastTime) / 1000);
      lastTime = now;
      const forward = keys.has('forward') ? 1 : 0;
      const backward = keys.has('back') ? 1 : 0;
      const steer = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      const throttle = forward - backward;
      const accel = throttle * 11;
      const angle = state.yaw;
      state.vx += Math.sin(angle) * accel * dt;
      state.vz += Math.cos(angle) * accel * dt;
      state.vx *= Math.pow(.86, dt * 60);
      state.vz *= Math.pow(.86, dt * 60);
      const speed = Math.hypot(state.vx, state.vz);
      if (steer) state.targetYaw += steer * dt * (1.4 + Math.min(speed, 5) * .08);
      state.yaw += (state.targetYaw - state.yaw) * .14;
      state.x += state.vx * dt;
      state.z += state.vz * dt;
      state.x = THREE.MathUtils.clamp(state.x, -14, 14);
      state.z = THREE.MathUtils.clamp(state.z, -38, 4);
      car.position.set(state.x, -.25 + Math.sin(now * .008) * Math.min(speed * .004, .025), state.z);
      car.rotation.y = state.yaw;
      wheels.forEach(w => w.rotation.x -= speed * dt * 1.8);
      portals.children.forEach((p, i) => { p.rotation.z += dt * (.2 + i * .015); p.position.y = .9 + Math.sin(now * .001 + i) * .15; });

      const { best, distance } = nearestSection();
      if (distance < 4.5 && best.id !== lastSection) {
        lastSection = best.id;
        drivePlace.textContent = best.name;
        const target = document.getElementById(best.id);
        if (target) {
          const top = target.getBoundingClientRect().top + scrollY - (header?.offsetHeight || 70);
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
          document.body.classList.add('section-transition');
          setTimeout(() => document.body.classList.remove('section-transition'), 650);
        }
      }
      const desiredCamX = state.x * .16;
      const desiredCamZ = state.z + 9;
      camera.position.x += (desiredCamX - camera.position.x) * .045;
      camera.position.z += (desiredCamZ - camera.position.z) * .045;
      camera.lookAt(state.x, .1, state.z - 5);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }).catch(() => {});
})();
