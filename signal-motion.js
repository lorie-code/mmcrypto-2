/* SIGNAL presentation only. No membership, referral, content or link behavior. */
(() => {
  'use strict';

  const boot = () => {
    const body = document.body;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hero = document.querySelector('#home');
    const photo = hero?.querySelector('.hero-photo');
    const scan = document.createElement('span');
    scan.className = 'signal-scan';
    scan.setAttribute('aria-hidden', 'true');
    photo?.append(scan);

    const headings = [...document.querySelectorAll('.section-heading,.journey-heading,.health-intro')];
    const lines = [...document.querySelectorAll('.proof-strip,.video-library-caption,.journey-controls,.social-grid')];
    lines.forEach(element => element.classList.add('signal-line'));

    let heroVisible = true;
    const syncMotion = () => {
      const paused = reduced.matches || body.classList.contains('motion-paused') || document.hidden || !heroVisible;
      scan.style.animationPlayState = paused ? 'paused' : 'running';
      // Keep every SIGNAL hero animation in sync with the existing pause control.
      // The custom property is inherited by the hero, so CSS-only effects stop
      // together with the scan line when the page is paused or out of view.
      body.style.setProperty('--signal-play-state', paused ? 'paused' : 'running');
      // The line itself is a pseudo-element; the custom property controls it too.
      scan.style.setProperty('--signal-play-state', paused ? 'paused' : 'running');
      scan.dataset.animationState = paused ? 'still' : 'running';
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('signal-visible');
            entry.target.closest('section')?.classList.add('signal-section-inview');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: .12 });
      [...headings,...lines].forEach(element => observer.observe(element));

      const heroObserver = new IntersectionObserver(entries => {
        heroVisible = entries[0]?.isIntersecting ?? true;
        syncMotion();
      }, { threshold: 0 });
      if (hero) heroObserver.observe(hero);
    } else {
      lines.forEach(element => element.classList.add('signal-visible'));
    }

    const navLinks = [...document.querySelectorAll('#site-nav > a[href^="#"]')]
      .filter(link => link.getAttribute('href') !== '#member-hub');
    const sectionLinks = navLinks.map(link => ({link, section:document.querySelector(link.getAttribute('href'))}))
      .filter(item => item.section);
    let scheduled = false;
    const updateNavigation = () => {
      scheduled = false;
      if (body.classList.contains('member-view') || document.querySelector('#public-content')?.hidden) {
        navLinks.forEach(link => {
          link.classList.remove('is-section-active');
          link.removeAttribute('aria-current');
        });
        return;
      }
      const marker = Math.max(120, Math.min(230, window.innerHeight * .32));
      let current = sectionLinks[0];
      sectionLinks.forEach(item => {
        if (item.section.getBoundingClientRect().top <= marker) current = item;
      });
      sectionLinks.forEach(item => {
        const active = item === current;
        item.link.classList.toggle('is-section-active', active);
        if (active) item.link.setAttribute('aria-current','location');
        else item.link.removeAttribute('aria-current');
      });
    };
    const queueNavigation = () => {
      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(updateNavigation);
      }
    };

    window.addEventListener('scroll', queueNavigation, {passive:true});
    window.addEventListener('resize', queueNavigation, {passive:true});
    window.addEventListener('hashchange', queueNavigation);
    document.addEventListener('visibilitychange', syncMotion);
    reduced.addEventListener('change', syncMotion);
    new MutationObserver(() => {
      syncMotion();
      queueNavigation();
    }).observe(body, {attributes:true,attributeFilter:['class']});
    syncMotion();
    updateNavigation();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
