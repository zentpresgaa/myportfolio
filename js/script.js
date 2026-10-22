// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Mobile nav toggle ----------
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

function setMenu(open) {
  burger.setAttribute('aria-expanded', String(open));
  navLinks.classList.toggle('is-open', open);
}

burger.addEventListener('click', () => {
  setMenu(burger.getAttribute('aria-expanded') !== 'true');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
    setMenu(false);
    burger.focus();
  }
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});

// Close the menu if the window grows past the mobile breakpoint
window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
  if (e.matches) setMenu(false);
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Horizontal mode ----------
// On wide screens the sections sit side by side in a track that scrolls sideways.
const track = document.getElementById('main');
const horizontal = window.matchMedia('(min-width: 900px) and (min-height: 600px)');
const isHorizontal = () => horizontal.matches;

// ---------- Highlight the current section in the nav ----------
const navMap = new Map(
  [...navLinks.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a])
);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navMap.forEach((a) => a.classList.remove('is-active'));
        const link = navMap.get(entry.target.id);
        if (link) link.classList.add('is-active');
      });
    },
    { root: null, threshold: 0.6 }
  );
  document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s));
}

// ---------- Reveal sections while scrolling ----------
// The class is added from JS so the page still shows everything if JS fails.
const revealTargets = document.querySelectorAll('[data-reveal]');

if (!reduceMotion && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');

  // Items inside the same section come in one after another.
  document.querySelectorAll('main section').forEach((section) => {
    section.querySelectorAll('[data-reveal]').forEach((el, i) => {
      el.style.setProperty('--reveal-delay', Math.min(i, 6));
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
}

// ---------- Turn wheel and arrow keys into sideways movement ----------
if (track) {
  // A panel that is taller than the screen scrolls vertically first; only once it
  // reaches its top or bottom does the wheel move the page sideways.
  const panelAtEdge = (panel, delta) => {
    if (!panel || panel.scrollHeight <= panel.clientHeight + 1) return true;
    return delta > 0
      ? panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 1
      : panel.scrollTop <= 0;
  };

  const currentPanel = () =>
    [...track.children].find((s) => {
      const r = s.getBoundingClientRect();
      return r.left < window.innerWidth / 2 && r.right > window.innerWidth / 2;
    });

  // Snapping is mandatory, so a few pixels would just spring back: move one whole
  // panel per gesture instead, and ignore the rest of a trackpad's momentum.
  let locked = false;
  const panels = () => [...track.children];

  const goTo = (index) => {
    const list = panels();
    const i = Math.max(0, Math.min(list.length - 1, index));
    locked = true;
    list[i].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'start', block: 'nearest' });
    setTimeout(() => { locked = false; }, reduceMotion ? 80 : 650);
  };

  const currentIndex = () => {
    const list = panels();
    const mid = window.innerWidth / 2;
    const i = list.findIndex((s) => {
      const r = s.getBoundingClientRect();
      return r.left < mid && r.right > mid;
    });
    return i === -1 ? 0 : i;
  };

  track.addEventListener('wheel', (e) => {
    if (!isHorizontal() || e.ctrlKey) return;
    const vertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
    const delta = vertical ? e.deltaY : e.deltaX;
    if (!delta) return;

    // A panel taller than the screen scrolls through its own content first.
    if (vertical && !panelAtEdge(currentPanel(), e.deltaY)) return;

    e.preventDefault();
    if (locked || Math.abs(delta) < 8) return;
    goTo(currentIndex() + (delta > 0 ? 1 : -1));
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (!isHorizontal()) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (typing) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); goTo(currentIndex() + 1); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(currentIndex() - 1); }
    if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    if (e.key === 'End') { e.preventDefault(); goTo(panels().length - 1); }
  });

  // Keep the footer's height in sync so the track never sits under it
  const setFooterHeight = () => {
    const f = document.querySelector('.site-footer');
    if (f) document.documentElement.style.setProperty('--footer-h', `${f.offsetHeight}px`);
  };
  setFooterHeight();
  addEventListener('resize', setFooterHeight);
}

// ---------- Reading progress ----------
const progress = document.getElementById('scroll-progress');

if (progress && !reduceMotion) {
  let ticking = false;
  const update = () => {
    let ratio = 0;
    if (isHorizontal() && track) {
      const max = track.scrollWidth - track.clientWidth;
      ratio = max > 0 ? track.scrollLeft / max : 0;
    } else {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ratio = max > 0 ? window.scrollY / max : 0;
    }
    progress.style.transform = `scaleX(${ratio})`;
    ticking = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  if (track) track.addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', update);
  update();
}

// ---------- Contact form ----------
// There's no backend, so the form opens the visitor's email app with the message filled in.
// To receive messages directly instead, connect a service like Formspree and remove this handler.
const form = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name.value.trim();
  const email = form.elements.email.value.trim();
  const message = form.elements.message.value.trim();

  const subject = `Melding fra ${name} via porteføljen`;
  const body = `${message}\n\n– ${name} (${email})`;
  window.location.href =
    `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  formNote.textContent = `Takk, ${name}! E-postprogrammet ditt skal nå åpne seg med meldingen klar til å sendes.`;
});
