import './style.css';

document.documentElement.classList.remove('no-js');
// Three.js loads in its own chunk so the copy paints before the 3D scene.
import('./scene.js').then(({ initScene }) => initScene(document.getElementById('scene')));

document.querySelectorAll('.year').forEach((el) => (el.textContent = new Date().getFullYear()));

// Nav turns solid once the hero scrolls away.
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu.
const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');
const setMenu = (open) => {
  toggle.setAttribute('aria-expanded', open);
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  links.classList.toggle('open', open);
};
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
links.addEventListener('click', (e) => e.target.closest('a') && setMenu(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

// Highlight the header link for the section in view.
const navLinks = [...links.querySelectorAll('a[data-section]')];
const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id === 'home' ? 'top' : entry.target.id;
      navLinks.forEach((a) => a.classList.toggle('active', a.dataset.section === id));
    }
  },
  { rootMargin: '-45% 0px -50% 0px' },
);
['home', 'collection', 'ayurvastra', 'notify'].forEach((id) => spy.observe(document.getElementById(id)));

// Fade sections in as they enter the viewport.
const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 90}ms`;
  io.observe(el);
});

// Collection tabs with arrow-key navigation.
const tabs = [...document.querySelectorAll('[role="tab"]')];
const selectTab = (tab) => {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute('aria-selected', on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  }
};
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => {
    selectTab(tab);
    tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });
  tab.addEventListener('keydown', (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
    next.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  });
});

// 3D tilt and glow on the collection cards (pointer devices only).
if (window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.transform = `rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) translateZ(0)`;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

// Waitlist form. Set VITE_WAITLIST_ENDPOINT (e.g. a Formspree or Google Apps Script URL)
// in Vercel to collect sign-ups; without it the form only validates and thanks the visitor.
const form = document.getElementById('notify-form');
const msg = document.getElementById('form-msg');
const endpoint = import.meta.env.VITE_WAITLIST_ENDPOINT;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  msg.classList.remove('error');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email address.';
    msg.classList.add('error');
    return;
  }
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, source: 'heyora.co' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    form.reset();
    msg.textContent = "You're on the list. We'll write the moment Heyora launches.";
  } catch {
    msg.textContent = 'Something went wrong. Please try again in a moment.';
    msg.classList.add('error');
  } finally {
    button.disabled = false;
  }
});
