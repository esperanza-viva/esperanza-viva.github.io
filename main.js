/* main.js - animaciones de scroll, barra de progreso, nav activo y parallax ligero */
document.addEventListener('DOMContentLoaded', function() {
    // Elementos a observar (clases de reveal)
    // include .appear so elements with that class animate on scroll (not immediately)
    const revealSelector = '.fade-in, .slide-left, .slide-right, .zoom-in, .stagger, .appear, [data-stagger]';
    const revealElements = document.querySelectorAll(revealSelector);

    // Observador para revelar elementos
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const el = entry.target;

            if (entry.isIntersecting) {
                // Staggered children
                if (el.classList.contains('stagger') || el.hasAttribute('data-stagger')) {
                    // primero asegurar que el contenedor también se muestre
                    el.classList.add('visible');
                    const children = Array.from(el.children);
                    children.forEach((child, i) => {
                        // pequeña demora entre cada hijo
                        setTimeout(() => child.classList.add('visible'), i * 80);
                    });
                } else {
                    el.classList.add('visible');
                }
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.12 });

    revealElements.forEach(el => {
        // Si es contenedor stagger, OBSERVA el contenedor, no cada hijo
        revealObserver.observe(el);
    });

    // Observe the hero heading so we can toggle a fallback 'Bienvenidos a Casa' overlay
    const heroH2 = document.querySelector('#bienvenida .contenido-bienvenida h2.fade-in');
    const heroFallback = document.querySelector('#bienvenida .hero-fallback');
    const headerWelcome = document.querySelector('.header-welcome');
    if (heroH2 && heroFallback) {
        const h2Obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                // If H2 is visible in viewport, wait until it has the `.visible` class
                // (this ensures the fallback disappears only after the heading animation finishes)
                if (e.isIntersecting) {
                    if (heroH2.classList.contains('visible')) {
                        heroFallback.classList.add('hidden');
                        if (headerWelcome) headerWelcome.classList.add('hidden');
                    } else {
                        // wait for the class 'visible' to be added, then hide fallbacks
                        const mo = new MutationObserver((mutations, obs) => {
                            if (heroH2.classList.contains('visible')) {
                                heroFallback.classList.add('hidden');
                                if (headerWelcome) headerWelcome.classList.add('hidden');
                                obs.disconnect();
                            }
                        });
                        mo.observe(heroH2, { attributes: true, attributeFilter: ['class'] });
                    }
                } else {
                    // heading not in viewport: show fallbacks
                    heroFallback.classList.remove('hidden');
                    if (headerWelcome) headerWelcome.classList.remove('hidden');
                }
            });
        }, { threshold: 0.12 });
        h2Obs.observe(heroH2);
        // Make sure fallback is hidden if heading is already visible
        // (in case user loads mid-page)
        // small timeout so initial reveal observer runs first
        // If heading already intersects on load, only hide fallbacks when it actually has .visible
        setTimeout(() => {
            if (heroH2.getBoundingClientRect().top < window.innerHeight) {
                if (heroH2.classList.contains('visible')) {
                    heroFallback.classList.add('hidden');
                    if (headerWelcome) headerWelcome.classList.add('hidden');
                } else {
                    // wait until .visible is added, then hide both
                    const mo2 = new MutationObserver((mutations, obs) => {
                        if (heroH2.classList.contains('visible')) {
                            heroFallback.classList.add('hidden');
                            if (headerWelcome) headerWelcome.classList.add('hidden');
                            obs.disconnect();
                        }
                    });
                    mo2.observe(heroH2, { attributes: true, attributeFilter: ['class'] });
                }
            }
        }, 50);
    }

    // Barra de progreso del scroll
    const progressBar = document.getElementById('scroll-progress');
    function updateProgress() {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollTop = window.scrollY || window.pageYOffset;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        if (progressBar) progressBar.style.width = pct + '%';
    }

    // Header - cambiar estilos cuando ya se hizo scroll
    const header = document.getElementById('site-header');
    function updateHeader() {
        if (!header) return;
        if (window.scrollY > 18) header.classList.add('scrolled'); else header.classList.remove('scrolled');
    }

    // Nav: marcar link activo según sección en pantalla
    const sections = document.querySelectorAll('main section[id]');
    const navLinks = document.querySelectorAll('.main-nav a');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const id = entry.target.id;
            // toggle nav active
            if (entry.isIntersecting) {
                navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            }
            // also toggle a class on the section so CSS can style section headings when in view
            entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
    }, { root: null, rootMargin: '-35% 0px -45% 0px', threshold: 0 });

    sections.forEach(sec => navObserver.observe(sec));

    // Parallax ligero para hero
    const hero = document.querySelector('.hero');
    function updateParallax() {
        if (!hero) return;
        const sc = window.scrollY;
        // mover un poco el background para efecto parallax
        hero.style.backgroundPosition = `center calc(50% + ${sc * 0.12}px)`;
    }

    // Optimizar updates usando requestAnimationFrame
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateProgress();
                updateHeader();
                updateParallax();
                ticking = false;
            });
            ticking = true;
        }
    }

    // Inicializar una pasada
    updateProgress();
    updateHeader();
    updateParallax();

    // Eventos
    window.addEventListener('scroll', onScroll, { passive: true });

    // Hacer que los enlaces del nav tengan scroll suave y cierren mobile menu si existiera
    navLinks.forEach(a => {
        a.addEventListener('click', (e) => {
            // si el enlace tiene hash, se hace smooth scroll nativo
            // cerrar menú en móviles si fuera necesario (no hay menú JS aquí, pero es útil para ampliar)
        });
    });

    /* ------------------ */
    /* Interacción Social (lazy-load embed para YouTube) */
    /* ------------------ */
    const socialCards = document.querySelectorAll('.social-card');

    socialCards.forEach(card => {
        // click handler
        card.addEventListener('click', () => handleSocial(card));
        // soporte teclado (Enter/Space)
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSocial(card);
            }
        });
    });

    function handleSocial(card) {
        // Si la tarjeta tiene data-src -> lazy-load de iframe (YouTube)
        const src = card.getAttribute('data-src');
        if (src) {
                // Si la tarjeta tiene la clase 'redirect', la abre en una nueva pestaña en lugar de incrustar.
                if (card.classList.contains('redirect')) {
                    window.open(src, '_blank', 'noopener');
                    return;
                }
                // Evitar que se cargue múltiples veces
                if (card.dataset.loaded) return;
            const wrapper = document.createElement('div');
            wrapper.className = 'social-embed-wrap';

            const iframe = document.createElement('iframe');
            iframe.className = 'social-embed'; // Esta línea es correcta, el error estaba en la anterior
            iframe.setAttribute('src', src);
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');

            wrapper.appendChild(iframe);
            card.appendChild(wrapper);
            card.dataset.loaded = '1';
        } else {
            // Si la tarjeta es un <a> el navegador ya maneja la apertura (target=_blank). No hacemos doble open.
            if (card.tagName === 'A') return;
            const href = card.getAttribute('href') || card.querySelector('a')?.getAttribute('href');
            if (href) window.open(href, '_blank', 'noopener');
        }
    }
});