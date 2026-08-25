(() => {
    "use strict";

    const revealElements = document.querySelectorAll(".reveal");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const header = document.querySelector(".navbar");

    const runtimeStyle = document.createElement("style");
    runtimeStyle.textContent = `
        html { scroll-behavior: smooth !important; }
        body { overflow-x: hidden; overflow-y: auto !important; }
        a, button, [role="button"] { cursor: pointer !important; }

        .reveal {
            opacity: 0;
            visibility: hidden;
            transform: translate3d(0, 48px, 0) scale(.975);
            filter: blur(12px);
            transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1), filter .9s cubic-bezier(.16,1,.3,1);
            transition-delay: var(--reveal-delay, 0ms);
            will-change: opacity, transform, filter;
        }

        .reveal.visible {
            opacity: 1;
            visibility: visible;
            transform: none;
            filter: blur(0);
        }

        .navbar {
            position: fixed !important;
            top: 0 !important;
            z-index: 5000 !important;
            transition: box-shadow .3s ease, background .3s ease;
        }

        .navbar.scrolled {
            background: rgba(255,255,255,.9) !important;
            box-shadow: 0 12px 38px rgba(16,24,40,.09);
        }

        .video-wrapper {
            position: relative;
            overflow: hidden;
        }

        .video-thumbnail-link {
            position: absolute;
            inset: 0;
            display: block;
            overflow: hidden;
            background: #08111f;
            cursor: pointer !important;
        }

        .video-thumbnail-link img {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform .65s cubic-bezier(.16,1,.3,1), filter .45s ease;
        }

        .video-thumbnail-link::after {
            content: "";
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(0,0,0,.02), rgba(0,0,0,.12) 45%, rgba(0,0,0,.65));
        }

        .video-thumbnail-link:hover img {
            transform: scale(1.07);
            filter: saturate(1.1) contrast(1.04);
        }

        .video-play {
            position: absolute;
            z-index: 2;
            left: 50%;
            top: 50%;
            width: 72px;
            height: 72px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(255,255,255,.55);
            border-radius: 50%;
            background: rgba(255,255,255,.15);
            backdrop-filter: blur(12px);
            transform: translate(-50%,-50%);
            transition: transform .3s ease, background .3s ease;
        }

        .video-play span {
            width: 0;
            height: 0;
            margin-left: 5px;
            border-top: 9px solid transparent;
            border-bottom: 9px solid transparent;
            border-left: 14px solid white;
        }

        .video-thumbnail-link:hover .video-play {
            transform: translate(-50%,-50%) scale(1.12);
            background: rgba(22,119,255,.82);
        }

        .review-card,
        .collab-card,
        .video-card {
            transform-style: preserve-3d;
            will-change: transform;
            transition: transform .22s ease, box-shadow .35s ease;
        }

        @media (max-width: 700px), (pointer: coarse) {
            .reveal {
                transform: translateY(28px);
                filter: blur(5px);
            }

            .video-play {
                width: 60px;
                height: 60px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .reveal {
                opacity: 1 !important;
                visibility: visible !important;
                transform: none !important;
                filter: none !important;
                transition: none !important;
            }
        }
    `;
    document.head.append(runtimeStyle);

    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

        revealElements.forEach((element, index) => {
            element.style.setProperty("--reveal-delay", `${Math.min((index % 4) * 90, 270)}ms`);
            revealObserver.observe(element);
        });
    } else {
        revealElements.forEach((element) => element.classList.add("visible"));
    }

    menuToggle?.addEventListener("click", () => {
        const open = navLinks?.classList.toggle("active") ?? false;
        menuToggle.setAttribute("aria-expanded", String(open));
    });

    navLinks?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuToggle?.setAttribute("aria-expanded", "false");
        });
    });

    const updateNavbar = () => header?.classList.toggle("scrolled", window.scrollY > 20);
    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });

    const fallbackIds = ["B3k-fNQCcLQ", "Rvlx9754160", "JHUjIM5g1JU", "GyRl4ynlEXQ"];

    document.querySelectorAll(".video-wrapper").forEach((wrapper, index) => {
        const iframe = wrapper.querySelector("iframe");
        const id = iframe?.src.match(/embed\/([^?&#/]+)/)?.[1] || fallbackIds[index];
        if (!id) return;

        const link = document.createElement("a");
        link.className = "video-thumbnail-link";
        link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.setAttribute("aria-label", `Ouvrir la vidéo ${index + 1} sur YouTube`);

        const image = document.createElement("img");
        image.src = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
        image.alt = `Miniature de la réalisation ${index + 1}`;
        image.loading = index < 2 ? "eager" : "lazy";
        image.decoding = "async";
        image.onerror = () => {
            image.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        };

        const play = document.createElement("span");
        play.className = "video-play";
        play.innerHTML = '<span aria-hidden="true"></span>';

        link.append(image, play);
        wrapper.replaceChildren(link);
    });

    document.querySelectorAll(".video-card, .review-card, .collab-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            if (window.matchMedia("(pointer: coarse)").matches) return;
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(900px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
})();
