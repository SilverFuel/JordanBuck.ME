import { animate, createTimeline, onScroll, stagger, utils } from 'animejs';
import './styles/main.css';
import { initAnimations } from './anim/motion.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('[data-header]');
const navMenu = document.querySelector('[data-nav-menu]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks = [...document.querySelectorAll('[data-nav-link]')];
const indicator = document.querySelector('[data-nav-indicator]');
const sections = [...document.querySelectorAll('main section[id]')];
const year = document.querySelector('[data-year]');

document.documentElement.classList.add('js-ready');
year.textContent = new Date().getFullYear();

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

let lastScroll = window.scrollY;
window.addEventListener(
  'scroll',
  () => {
    const currentScroll = window.scrollY;
    header?.classList.toggle('is-hidden', currentScroll > lastScroll && currentScroll > 120);
    header?.classList.toggle('is-scrolled', currentScroll > 24);
    lastScroll = currentScroll;
    updateActiveNav();
  },
  { passive: true },
);

window.addEventListener('resize', () => {
  updateActiveNav();
});

window.addEventListener('hashchange', () => {
  window.setTimeout(updateActiveNav, 120);
});

initAnimations({
  animate,
  createTimeline,
  onScroll,
  stagger,
  utils,
  reduceMotion,
});

updateActiveNav();
