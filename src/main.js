import {
  animate,
  createDraggable,
  createSpring,
  createTimeline,
  onScroll,
  spring,
  stagger,
  utils,
} from 'animejs';
import './styles/main.css';
import { initAnimations } from './anim/motion.js';

const RECOMMENDATIONS_LIVE = false;
const recommendations = [
  {
    quote: 'Jordan turns chaotic escalations into calm, repeatable process. He owns outcomes, not just tickets.',
    source: 'Name, Title, Organization',
  },
  {
    quote: 'One of the few technical leaders who can translate a messy incident into a plan leadership actually understands.',
    source: 'Name, Title, Organization',
  },
  {
    quote: 'He modernizes without breaking things — and brings the team with him.',
    source: 'Name, Title, Organization',
  },
];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollProgress = document.querySelector('[data-scroll-progress]');

function configureRecommendations() {
  const section = document.querySelector('[data-recommendations-section]');
  const navLink = document.querySelector('[data-recommendations-nav]');
  const list = document.querySelector('[data-recommendations-list]');

  if (!RECOMMENDATIONS_LIVE) {
    section?.remove();
    navLink?.remove();
    return;
  }

  section?.removeAttribute('hidden');
  navLink?.removeAttribute('hidden');

  if (!list) {
    return;
  }

  list.replaceChildren(
    ...recommendations.map(({ quote, source }) => {
      const card = document.createElement('figure');
      const blockquote = document.createElement('blockquote');
      const figcaption = document.createElement('figcaption');

      card.className = 'quote-card reveal-card';
      blockquote.textContent = quote;
      figcaption.textContent = `— ${source}`;
      card.append(blockquote, figcaption);

      return card;
    }),
  );
}

configureRecommendations();

const header = document.querySelector('[data-header]');
const navMenu = document.querySelector('[data-nav-menu]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('[data-nav-link]')];
const indicator = document.querySelector('[data-nav-indicator]');
const sections = [...document.querySelectorAll('main section[id]')];
const year = document.querySelector('[data-year]');
const copyEmailButton = document.querySelector('[data-copy-email]');
const copyStatus = document.querySelector('[data-copy-status]');

document.documentElement.classList.add('js-ready');
if (year) {
  year.textContent = new Date().getFullYear();
}

function setNavOpen(isOpen) {
  navToggle?.setAttribute('aria-expanded', String(isOpen));
  navMenu?.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('nav-open', isOpen);
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setNavOpen(!isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

copyEmailButton?.addEventListener('click', async () => {
  const email = copyEmailButton.dataset.email;

  if (!email) {
    return;
  }

  try {
    await navigator.clipboard.writeText(email);
    if (copyStatus) {
      copyStatus.textContent = 'Copied';
    }
    copyEmailButton.textContent = 'Copied';
  } catch {
    if (copyStatus) {
      copyStatus.textContent = email;
    }
  }

  window.setTimeout(() => {
    if (copyStatus) {
      copyStatus.textContent = '';
    }
    copyEmailButton.textContent = 'Copy email';
  }, 2200);
});

function moveIndicator(link) {
  if (!indicator || !link || window.matchMedia('(max-width: 719px)').matches) {
    if (indicator) {
      indicator.style.opacity = link ? '1' : '0';
    }
    return;
  }

  const parentRect = navMenu.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  indicator.style.opacity = '1';
  indicator.style.width = `${linkRect.width}px`;
  indicator.style.transform = `translate3d(${linkRect.left - parentRect.left}px, 0, 0)`;
}

function updateActiveNav() {
  const activationLine = window.innerHeight < 760 ? 150 : window.innerHeight * 0.34;
  const activeSection = sections.reduce((current, section) => {
    return section.getBoundingClientRect().top <= activationLine ? section : current;
  }, sections[0]);
  const activeLink = navLinks.find((link) => link.hash === `#${activeSection.id}`);

  navLinks.forEach((link) => {
    link.toggleAttribute('aria-current', link === activeLink);
  });
  moveIndicator(activeLink);
}

function updateScrollProgress() {
  if (!scrollProgress) {
    return;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
}

let lastScroll = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const currentScroll = window.scrollY;
    header?.classList.toggle('is-hidden', currentScroll > lastScroll && currentScroll > 120);
    header?.classList.toggle('is-scrolled', currentScroll > 24);
    lastScroll = currentScroll;
    updateActiveNav();
    updateScrollProgress();
  },
  { passive: true },
);

window.addEventListener('resize', () => {
  updateActiveNav();
  updateScrollProgress();
});

window.addEventListener('hashchange', () => {
  window.setTimeout(updateActiveNav, 120);
});

initAnimations({
  animate,
  createDraggable,
  createSpring,
  createTimeline,
  onScroll,
  spring,
  stagger,
  utils,
  reduceMotion,
});

updateActiveNav();
updateScrollProgress();
