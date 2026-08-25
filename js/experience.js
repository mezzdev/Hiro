(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches;
  if (reduce) return;

  const style = document.createElement('style');
  style.textContent = `
    /* Cinematic room transition */
    body::before{content:"";position:fixed;inset:0;z-index:9990;pointer-events:none;background:#f7f9fc;opacity:0;transform:scaleX(0);transform-origin:right center;transition:transform .58s cubic-bezier(.76,0,.24,1),opacity .58s ease}
    body.section-transition::before{opacity:1;transform:scaleX(1);transform-origin:left center}
    body.section-arrived::after{content:"";position:fixed;inset:0;z-index:9989;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(22,119,255,.08),transparent 48%);animation:hiroArrive .75s ease-out forwards}
    @keyframes hiroArrive{0%{opacity:1;transform:scale(.92)}100%{opacity:0;transform:scale(1.12)}}
    /* Deep floating exhibition room */
    main,.hero,.section{transform-style:preserve-3d;perspective:1600px}
    .hero-content,.section-container{transform-style:preserve-3d;will-change:transform}
    .section-container{transition:filter .45s ease}
    .video-card,.skill-card,.review-card,.collab-card,.discord-button{transform-style:preserve-3d;backface-visibility:hidden;will-change:transform,filter}
    .video-card{--float-z:0px;--float-x:0px;--float-y:0px;--float-rx:0deg;--float-ry:0deg;transform:translate3d(var(--float-x),var(--float-y),var(--float-z)) rotateX(var(--float-rx)) rotateY(var(--float-ry));transition:box-shadow .4s ease,filter .4s ease}
    .video-wrapper{transform:translateZ(75px);transform-style:preserve-3d;backface-visibility:hidden}
    .video-card::after{content:"";position:absolute;inset:8px;z-index:-2;border-radius:inherit;transform:translateZ(-110px) scale(.84);box-shadow:0 90px 150px rgba(16,24,40,.18);pointer-events:none}
    .skill-card,.review-card,.collab-card{transform:translateZ(0);}
    .skill-card::before,.review-card::before,.collab-card::before{content:"";position:absolute;inset:0;border-radius:inherit;transform:translateZ(35px);pointer-events:none;box-shadow:inset 0 1px rgba(255,255,255,.7)}
    /* Kill the textual OPEN / WATCH cursor label */
    .cursor-label{display:none!important;opacity:0!important}
    @media(pointer:coarse){.video-card,.skill-card,.review-card,.collab-card,.discord-button{transform:none!important}.section-container{transform:none!important}}
  `;
  document.head.appendChild(style);

  // Every internal section navigation gets a cinematic wipe, then a soft arrival pulse.
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const id = link.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      document.body.classList.remove('section-arrived');
      document.body.classList.add('section-transition');
      const offset = document.querySelector('.navbar')?.offsetHeight || 70;
      setTimeout(() => {
        window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset), behavior: 'auto' });
        history.replaceState(null, '', id);
        document.body.classList.remove('section-transition');
        document.body.classList.add('section-arrived');
        setTimeout(() => document.body.classList.remove('section-arrived'), 800);
      }, 520);
    });
  });

  if (!fine) return;

  const objects = [...document.querySelectorAll('.hero-content,.section-container,.skill-card,.video-card,.review-card,.collab-card,.discord-button')];
  let ticking = false;
  let smoothScroll = window.scrollY;
  let targetScroll = window.scrollY;
  let px = 0, py = 0, sx = 0, sy = 0;
  window.addEventListener('scroll', () => { targetScroll = window.scrollY; }, { passive: true });
  window.addEventListener('mousemove', e => {
    px = (e.clientX / window.innerWidth - .5) * 2;
    py = (e.clientY / window.innerHeight - .5) * 2;
  }, { passive: true });

  const frame = () => {
    smoothScroll += (targetScroll - smoothScroll) * .085;
    sx += (px - sx) * .055;
    sy += (py - sy) * .055;
    const vh = window.innerHeight;

    objects.forEach((el, index) => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height * .5;
      const distance = Math.max(-1.6, Math.min(1.6, (center - vh * .5) / (vh * .75)));
      const visible = Math.max(0, 1 - Math.abs(distance));
      const depth = (visible * 155) + ((index % 4) * 13) - 30;
      const driftX = sx * (index % 2 ? -16 : 16) * visible;
      const driftY = -distance * 54 + sy * 10;
      const rotateX = -distance * 8 + sy * -2.5;
      const rotateY = distance * 7 + sx * 2.5;

      if (el.classList.contains('video-card')) {
        el.style.setProperty('--float-z', `${depth + 35}px`);
        el.style.setProperty('--float-x', `${driftX}px`);
        el.style.setProperty('--float-y', `${driftY}px`);
        el.style.setProperty('--float-rx', `${rotateX}deg`);
        el.style.setProperty('--float-ry', `${rotateY}deg`);
        el.style.filter = `drop-shadow(0 ${Math.max(8, visible * 38)}px ${Math.max(18, visible * 55)}px rgba(16,24,40,.12))`;
      } else {
        el.style.transform = `translate3d(${driftX}px,${driftY}px,${depth}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        el.style.filter = `drop-shadow(0 ${Math.max(4, visible * 18)}px ${Math.max(14, visible * 35)}px rgba(16,24,40,.08))`;
      }
    });
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
