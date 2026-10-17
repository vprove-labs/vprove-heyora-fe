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
