/* ============================================================
   Conrad Forbes Portfolio — Interaction Layer
   GSAP 3 + ScrollTrigger
============================================================ */

(function () {
  'use strict';

  /* Always start at the top on load/refresh.
     Strip any URL hash so the browser can't jump to an anchor. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);
  window.addEventListener('load', () => window.scrollTo(0, 0));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  gsap.registerPlugin(ScrollTrigger);

  const EASE_OUT  = 'power3.out';
  const EASE_CIRC = 'circ.out';

  /* ============================================================
     0. AGE — calculated from DOB, updates automatically
  ============================================================ */
  function initAge() {
    const DOB = new Date('2000-02-03');
    const now = new Date();
    let age = now.getFullYear() - DOB.getFullYear();
    const hasHadBirthday =
      now.getMonth() > DOB.getMonth() ||
      (now.getMonth() === DOB.getMonth() && now.getDate() >= DOB.getDate());
    if (!hasHadBirthday) age--;

    document.querySelectorAll('#hero-age').forEach(el => {
      el.textContent = age;
    });
  }

  /* ============================================================
     1. THEME TOGGLE — dark/light with localStorage persistence
  ============================================================ */
  function initThemeToggle() {
    const html   = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    /* Determine initial theme: saved preference → system preference → light */
    const saved      = localStorage.getItem('cf-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial    = saved || (systemDark ? 'dark' : 'light');

    applyTheme(initial);

    toggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next    = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('cf-theme', next);
    });

    function applyTheme(theme) {
      if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        toggle.setAttribute('aria-label', 'Switch to light mode');
      } else {
        html.removeAttribute('data-theme');
        toggle.setAttribute('aria-label', 'Switch to dark mode');
      }
      /* Refresh ScrollTrigger so pinned sections recalculate on theme change */
      ScrollTrigger.refresh();
    }
  }

  /* ============================================================
     2. HERO INTRO — staggered load-in
  ============================================================ */
  function initHeroIntro() {
    if (prefersReducedMotion) {
      gsap.set('.reveal-load', { opacity: 1 });
      gsap.set('.hero-age-block', { opacity: 1 });
      gsap.set('.hero-scroll', { opacity: 1 });
      gsap.set('.hero-visual', { opacity: 1 });
      gsap.set('#hero .line-inner', { y: 0 });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: EASE_OUT } });

    /* Tag fades in first */
    tl.to('.hero-tag', { opacity: 1, duration: 0.5 });

    /* Name lines slide up */
    tl.to('#hero .line-inner', {
      y: 0,
      duration: 1.1,
      stagger: 0.08,
      ease: EASE_CIRC,
    }, '-=0.2');

    /* Age appears just after the name finishes */
    tl.to('.hero-age-block', { opacity: 1, duration: 0.6 }, '-=0.3');

    /* Statement, CTAs, scroll hint */
    tl.to('.hero-statement', { opacity: 1, duration: 0.6 }, '-=0.3');
    tl.to('.hero-actions',   { opacity: 1, duration: 0.6 }, '-=0.4');
    tl.to('.hero-scroll',    { opacity: 1, duration: 0.5 }, '-=0.2');
  }

  /* ============================================================
     3. HERO SVG — node graph draw-in
  ============================================================ */
  function initHeroGraph() {
    if (prefersReducedMotion) return;

    const visual = document.querySelector('.hero-visual');
    if (!visual) return;

    const edges = gsap.utils.toArray('.graph-edge');
    const nodes = gsap.utils.toArray('.graph-node');

    edges.forEach(edge => {
      const len = edge.getTotalLength ? edge.getTotalLength() : 200;
      gsap.set(edge, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
    });

    gsap.set(nodes, { scale: 0, transformOrigin: 'center', opacity: 1 });

    const tl = gsap.timeline({ delay: 0.6 });

    tl.to(visual, { opacity: 1, duration: 0.8, ease: EASE_OUT });
    tl.to(edges, {
      strokeDashoffset: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: 'power2.inOut',
    }, '-=0.4');
    tl.to(nodes, {
      scale: 1,
      duration: 0.4,
      stagger: 0.06,
      ease: 'back.out(2)',
    }, '-=0.8');
  }

  /* ============================================================
     4. NAVIGATION — hide on scroll-down, show on scroll-up
  ============================================================ */
  function initNavigation() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let lastY   = 0;
    let ticking = false;

    function updateNav() {
      const y = window.scrollY;
      header.classList.toggle('scrolled', y > 40);

      if (y > window.innerHeight * 0.5) {
        if (y > lastY + 8)      header.classList.add('hidden');
        else if (y < lastY - 8) header.classList.remove('hidden');
      } else {
        header.classList.remove('hidden');
      }

      lastY   = y;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateNav); ticking = true; }
    }, { passive: true });
  }

  /* ============================================================
     5. SCROLL PROGRESS BAR
  ============================================================ */
  function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    ScrollTrigger.create({
      start: 'top top',
      end:   'bottom bottom',
      onUpdate: self => { bar.style.width = (self.progress * 100) + '%'; },
    });
  }

  /* ============================================================
     6. CHAPTER REVEALS — line-by-line heading + body text
  ============================================================ */
  function initChapterReveals() {
    const chapters = gsap.utils.toArray('.chapter');
    const BESPOKE  = new Set(['chapter-lab', 'chapter-shift']);

    chapters.forEach(chapter => {
      if (BESPOKE.has(chapter.id)) return;

      const lines    = chapter.querySelectorAll('.line-inner');
      const textBody = chapter.querySelector('.chapter-text');

      if (prefersReducedMotion) {
        gsap.set(lines, { y: 0 });
        if (textBody) gsap.set(textBody, { opacity: 1 });
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: chapter,
          start:   'top 72%',
          toggleActions: 'play none none none',
        },
      });

      if (lines.length) {
        tl.to(lines, { y: 0, duration: 0.9, stagger: 0.1, ease: EASE_CIRC });
      }

      if (textBody) {
        tl.fromTo(textBody,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.7, ease: EASE_OUT },
          '-=0.5'
        );
      }
    });
  }

  /* ============================================================
     7. EDUCATION & SKILLS
  ============================================================ */
  function initListReveals() {
    ScrollTrigger.create({
      trigger: '.education-list',
      start:   'top 80%',
      onEnter: () => {
        if (prefersReducedMotion) { gsap.set('.education-list', { opacity: 1 }); return; }
        gsap.to('.education-list', { opacity: 1, duration: 0.5, ease: EASE_OUT });
        gsap.fromTo('.edu-item',
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: EASE_OUT, delay: 0.15 }
        );
      },
    });

    ScrollTrigger.create({
      trigger: '.skills-grid',
      start:   'top 80%',
      onEnter: () => {
        if (prefersReducedMotion) { gsap.set('.skills-grid', { opacity: 1 }); return; }
        gsap.to('.skills-grid', { opacity: 1, duration: 0.5, ease: EASE_OUT });
        gsap.fromTo('.skill-group',
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: EASE_OUT, delay: 0.1 }
        );
      },
    });
  }

  /* ============================================================
     8. THE LAB — pinned on desktop, simple reveal on mobile
  ============================================================ */
  function initLabSection() {
    const labSection = document.getElementById('chapter-lab');
    if (!labSection) return;

    const cellSvg  = labSection.querySelector('.cell-svg');
    const rings    = labSection.querySelectorAll('.cell-ring');
    const spokes   = labSection.querySelector('.cell-spokes');
    const nodes    = labSection.querySelector('.cell-nodes');
    const labTags  = labSection.querySelector('.lab-tags');
    const lines    = labSection.querySelectorAll('.line-inner');
    const textBody = labSection.querySelector('.chapter-text');

    if (prefersReducedMotion) {
      gsap.set([cellSvg, spokes, nodes, labTags], { opacity: 1 });
      gsap.set(lines, { y: 0 });
      if (textBody) gsap.set(textBody, { opacity: 1 });
      rings.forEach(r => gsap.set(r, { strokeDashoffset: 0 }));
      return;
    }

    /* Set up ring circumferences for draw animation */
    rings.forEach(ring => {
      const r   = parseFloat(ring.getAttribute('r')) || 100;
      const len = 2 * Math.PI * r;
      gsap.set(ring, { strokeDasharray: len, strokeDashoffset: len });
    });

    const isMobile = window.innerWidth < 768;

    if (isMobile) {
      /* On mobile: no pin — simple scroll-triggered reveal */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: labSection,
          start:   'top 70%',
          toggleActions: 'play none none none',
        },
      });

      tl.to(cellSvg, { opacity: 0.5, duration: 0.6 }, 0);
      const ringOrder = [3, 2, 1, 0, 4];
      ringOrder.forEach((idx, i) => {
        tl.to(rings[idx], { strokeDashoffset: 0, duration: 0.5 }, i * 0.1);
      });
      tl.to(spokes,   { opacity: 0.4, duration: 0.4 }, 0.3);
      tl.to(nodes,    { opacity: 0.5, duration: 0.4 }, 0.4);
      tl.to(lines,    { y: 0, duration: 0.7, stagger: 0.1, ease: EASE_CIRC }, 0.2);
      if (textBody) tl.fromTo(textBody, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 }, 0.5);
      if (labTags)  tl.to(labTags, { opacity: 1, duration: 0.4 }, 0.7);

    } else {
      /* Desktop: cinematic pin with scrub */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: labSection,
          start:   'top top',
          end:     '+=140%',
          pin:     true,
          scrub:   1.2,
          anticipatePin: 1,
        },
      });

      tl.to(cellSvg, { opacity: 1, duration: 0.3 }, 0);

      const ringOrder = [3, 2, 1, 0, 4];
      ringOrder.forEach((idx, i) => {
        tl.to(rings[idx], { strokeDashoffset: 0, duration: 0.25 }, 0.05 + i * 0.1);
      });

      tl.to(spokes,  { opacity: 0.5, duration: 0.2 }, 0.3);
      tl.to(nodes,   { opacity: 0.6, duration: 0.2 }, 0.35);

      lines.forEach((line, i) => {
        tl.to(line, { y: 0, duration: 0.3, ease: EASE_CIRC }, 0.25 + i * 0.1);
      });

      if (textBody) tl.fromTo(textBody, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.5);
      if (labTags)  tl.to(labTags, { opacity: 1, duration: 0.25 }, 0.65);
    }
  }

  /* ============================================================
     9. WORK CARDS — staggered reveal
  ============================================================ */
  function initWorkCards() {
    const cards = gsap.utils.toArray('.work-card');
    if (!cards.length) return;

    if (prefersReducedMotion) { gsap.set(cards, { opacity: 1 }); return; }

    gsap.set(cards, { y: 32 });

    ScrollTrigger.create({
      trigger: '.work-grid',
      start:   'top 75%',
      onEnter: () => {
        gsap.to(cards, {
          opacity: 1, y: 0,
          duration: 0.65,
          stagger:  0.1,
          ease:     EASE_OUT,
          clearProps: 'transform',
        });
      },
    });
  }

  /* ============================================================
     10. ABOUT SECTION
  ============================================================ */
  function initAboutSection() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    const lines      = aboutSection.querySelectorAll('.line-inner');
    const bio        = aboutSection.querySelector('.about-bio');
    const principles = aboutSection.querySelector('.principles');

    if (prefersReducedMotion) {
      gsap.set(lines, { y: 0 });
      gsap.set([bio, principles], { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: aboutSection,
        start:   'top 70%',
        toggleActions: 'play none none none',
      },
    });

    if (lines.length) tl.to(lines, { y: 0, duration: 0.9, stagger: 0.1, ease: EASE_CIRC });
    if (bio) tl.fromTo(bio, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE_OUT }, '-=0.5');
    if (principles) {
      tl.fromTo(principles, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: EASE_OUT }, '-=0.3');
      tl.fromTo('.principles-list li',
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.08, ease: EASE_OUT },
        '-=0.4'
      );
    }
  }

  /* ============================================================
     11. CONTACT SECTION
  ============================================================ */
  function initContactSection() {
    const contactSection = document.getElementById('contact');
    if (!contactSection) return;

    const lines  = contactSection.querySelectorAll('.line-inner');
    const header = contactSection.querySelector('.contact-header');
    const body   = contactSection.querySelector('.contact-body');

    if (prefersReducedMotion) {
      gsap.set(lines, { y: 0 });
      gsap.set([header, body], { opacity: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: contactSection,
        start:   'top 70%',
        toggleActions: 'play none none none',
      },
    });

    if (lines.length)  tl.to(lines, { y: 0, duration: 1.0, stagger: 0.12, ease: EASE_CIRC });
    if (header) tl.to(header, { opacity: 1, duration: 0.6, ease: EASE_OUT }, '-=0.5');
    if (body)   tl.fromTo(body, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT }, '-=0.4');
  }

  /* ============================================================
     12. WORK TITLE REVEAL
  ============================================================ */
  function initWorkTitle() {
    const workSection = document.getElementById('work');
    if (!workSection) return;

    const lines = workSection.querySelectorAll('.section-title .line-inner');
    if (!lines.length) return;

    if (prefersReducedMotion) { gsap.set(lines, { y: 0 }); return; }

    gsap.to(lines, {
      y: 0, duration: 0.9, stagger: 0.1, ease: EASE_CIRC,
      scrollTrigger: {
        trigger: workSection,
        start:   'top 75%',
        toggleActions: 'play none none none',
      },
    });
  }

  /* ============================================================
     13. CHAPTER 4: SHIFT — simple reveal
  ============================================================ */
  function initShiftChapter() {
    const el = document.getElementById('chapter-shift');
    if (!el || prefersReducedMotion) return;

    const lines    = el.querySelectorAll('.line-inner');
    const textBody = el.querySelector('.chapter-text');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start:   'top 70%',
        toggleActions: 'play none none none',
      },
    });

    if (lines.length) tl.to(lines, { y: 0, duration: 0.9, stagger: 0.1, ease: EASE_CIRC });
    if (textBody) tl.fromTo(textBody, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, ease: EASE_OUT }, '-=0.5');
  }

  /* ============================================================
     INIT
  ============================================================ */
  function init() {
    initAge();
    initThemeToggle();
    initHeroIntro();
    initHeroGraph();
    initNavigation();
    initScrollProgress();
    initChapterReveals();
    initListReveals();
    initLabSection();
    initWorkTitle();
    initWorkCards();
    initAboutSection();
    initContactSection();
    initShiftChapter();

    window.addEventListener('load', () => { ScrollTrigger.refresh(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
