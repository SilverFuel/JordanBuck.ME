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
const sectionIndexCurrent = document.querySelector('[data-section-current]');
const sectionIndexTotal = document.querySelector('[data-section-total]');
const sectionIndexLabel = document.querySelector('[data-section-label]');
const sectionLabels = {
  hero: 'Intro',
  impact: 'Scope',
  about: 'About',
  work: 'Impact',
  projects: 'Projects',
  skills: 'Skills',
  contact: 'Contact',
};

document.documentElement.classList.add('js-ready');
if (year) {
  year.textContent = new Date().getFullYear();
}
if (sectionIndexTotal) {
  sectionIndexTotal.textContent = String(sections.length).padStart(2, '0');
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

function initProjectCarousel() {
  const carousel = document.querySelector('[data-project-carousel]');

  if (!carousel) {
    return;
  }

  const viewport = carousel.querySelector('[data-project-viewport]');
  const track = carousel.querySelector('[data-project-track]');
  const slides = [...carousel.querySelectorAll('[data-project-slide]')];
  const previousButton = carousel.querySelector('[data-project-prev]');
  const nextButton = carousel.querySelector('[data-project-next]');
  const currentLabel = carousel.querySelector('[data-project-current]');
  const totalLabel = carousel.querySelector('[data-project-total]');

  if (!viewport || !track || !slides.length) {
    return;
  }

  let activeIndex = 0;
  let updateFrame = 0;
  let dragPointerId = null;
  let dragStartX = 0;
  let dragStartScroll = 0;
  let dragMoved = false;

  const slideOffset = (slide) => slide.offsetLeft - track.offsetLeft;
  const findNearestIndex = () => {
    return slides.reduce((nearest, slide, index) => {
      const currentDistance = Math.abs(slideOffset(slide) - viewport.scrollLeft);
      const nearestDistance = Math.abs(slideOffset(slides[nearest]) - viewport.scrollLeft);

      return currentDistance < nearestDistance ? index : nearest;
    }, 0);
  };

  const renderState = () => {
    updateFrame = 0;
    activeIndex = findNearestIndex();

    if (currentLabel) {
      currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
    }
    if (totalLabel) {
      totalLabel.textContent = String(slides.length).padStart(2, '0');
    }

    slides.forEach((slide, index) => {
      slide.toggleAttribute('aria-current', index === activeIndex);
    });

    if (previousButton) {
      previousButton.disabled = activeIndex === 0;
    }
    if (nextButton) {
      nextButton.disabled = activeIndex === slides.length - 1;
    }
  };

  const queueStateUpdate = () => {
    if (!updateFrame) {
      updateFrame = requestAnimationFrame(renderState);
    }
  };

  const goTo = (index) => {
    const nextIndex = Math.min(Math.max(index, 0), slides.length - 1);

    viewport.scrollTo({
      left: slideOffset(slides[nextIndex]),
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    });
  };

  previousButton?.addEventListener('click', () => goTo(activeIndex - 1));
  nextButton?.addEventListener('click', () => goTo(activeIndex + 1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(activeIndex + 1);
    }
  });

  viewport.addEventListener('scroll', queueStateUpdate, { passive: true });
  viewport.addEventListener('dragstart', (event) => event.preventDefault());

  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) {
      return;
    }

    dragPointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    dragMoved = false;
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener('pointermove', (event) => {
    if (event.pointerId !== dragPointerId) {
      return;
    }

    const delta = event.clientX - dragStartX;
    dragMoved ||= Math.abs(delta) > 4;
    viewport.scrollLeft = dragStartScroll - delta;

    if (dragMoved) {
      event.preventDefault();
    }
  });

  const releaseDrag = (event) => {
    if (event.pointerId !== dragPointerId) {
      return;
    }

    if (viewport.hasPointerCapture?.(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    viewport.classList.remove('is-dragging');
    dragPointerId = null;

    if (dragMoved) {
      goTo(findNearestIndex());
    }
  };

  viewport.addEventListener('pointerup', releaseDrag);
  viewport.addEventListener('pointercancel', releaseDrag);

  const carouselResizeObserver = new ResizeObserver(() => {
    goTo(activeIndex);
    queueStateUpdate();
  });
  carouselResizeObserver.observe(viewport);

  renderState();
}

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
  const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  const activeSection = atPageEnd
    ? sections.at(-1)
    : sections.reduce((current, section) => {
        return section.getBoundingClientRect().top <= activationLine ? section : current;
      }, sections[0]);
  const activeLink = navLinks.find((link) => link.hash === `#${activeSection.id}`);

  navLinks.forEach((link) => {
    link.toggleAttribute('aria-current', link === activeLink);
  });
  moveIndicator(activeLink);

  const sectionIndex = sections.indexOf(activeSection);
  if (sectionIndexCurrent) {
    sectionIndexCurrent.textContent = String(sectionIndex + 1).padStart(2, '0');
  }
  if (sectionIndexLabel) {
    sectionIndexLabel.textContent = sectionLabels[activeSection.id] ?? activeSection.id;
  }
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

initProjectCarousel();
updateActiveNav();
updateScrollProgress();
