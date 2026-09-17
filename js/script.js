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
    { rootMargin: '-45% 0px -50% 0px' }
  );
  document.querySelectorAll('main section[id]').forEach((s) => observer.observe(s));
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
