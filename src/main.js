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
const sectionIndex = document.querySelector('[data-section-index]');
const sectionIndexMenu = document.querySelector('[data-section-menu]');
const sectionIndexToggle = document.querySelector('[data-section-toggle]');
const sectionJumpLinks = [...document.querySelectorAll('[data-section-jump]')];
const sectionLabels = {
  hero: 'Intro',
  about: 'Leadership',
  work: 'Work',
  projects: 'Projects',
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

function setSectionIndexOpen(isOpen) {
  sectionIndex?.classList.toggle('is-open', isOpen);
  if (sectionIndexMenu) {
    sectionIndexMenu.toggleAttribute('inert', !isOpen);
    sectionIndexMenu.setAttribute('aria-hidden', String(!isOpen));
  }
  sectionIndexToggle?.setAttribute('aria-expanded', String(isOpen));
  sectionIndexToggle?.setAttribute('aria-label', isOpen ? 'Close section navigator' : 'Open section navigator');
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  setSectionIndexOpen(false);
  setNavOpen(!isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => setNavOpen(false));
});

sectionIndexToggle?.addEventListener('click', () => {
  setNavOpen(false);
  setSectionIndexOpen(sectionIndexToggle.getAttribute('aria-expanded') !== 'true');
});

sectionJumpLinks.forEach((link) => {
  link.addEventListener('click', () => setSectionIndexOpen(false));
});

document.addEventListener('pointerdown', (event) => {
  if (sectionIndex?.classList.contains('is-open') && !sectionIndex.contains(event.target)) {
    setSectionIndexOpen(false);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sectionIndex?.classList.contains('is-open')) {
    setSectionIndexOpen(false);
    sectionIndexToggle?.focus();
  }
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

function initOperationsConsole() {
  const consoleElement = document.querySelector('[data-operations-console]');

  if (!consoleElement) {
    return;
  }

  const field = consoleElement.querySelector('[data-operations-field]');
  const modeButtons = [...consoleElement.querySelectorAll('[data-operations-mode]')];
  const label = consoleElement.querySelector('[data-operations-label]');
  const value = consoleElement.querySelector('[data-operations-value]');
  const detail = consoleElement.querySelector('[data-operations-detail]');
  const modes = {
    software: {
      label: 'Software catalog',
      value: '2,700',
      detail: 'Software titles supported',
      isLit: (index) => index % 3 !== 1 || index === 8 || index === 19,
    },
    endpoints: {
      label: 'Endpoint estate',
      value: '38,000+',
      detail: 'Windows and Mac devices managed',
      isLit: () => true,
    },
    team: {
      label: 'People leadership',
      value: '20',
      detail: 'Across Tier 3 and Software Distribution',
      isLit: (index) => index >= 4 && index <= 23,
    },
  };
  const nodes = Array.from({ length: 28 }, (_, index) => {
    const node = document.createElement('span');

    node.style.setProperty('--node-delay', `${(index % 7) * 90}ms`);
    return node;
  });

  field?.replaceChildren(...nodes);

  const setMode = (modeName) => {
    const mode = modes[modeName];

    if (!mode) {
      return;
    }

    consoleElement.dataset.scope = modeName;
    if (label) label.textContent = mode.label;
    if (value) value.textContent = mode.value;
    if (detail) detail.textContent = mode.detail;

    modeButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.operationsMode === modeName));
    });
    nodes.forEach((node, index) => {
      node.classList.toggle('is-lit', mode.isLit(index));
      node.classList.toggle('is-core', modeName === 'team' && index >= 10 && index <= 17);
    });
  };

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.operationsMode));
  });

  consoleElement.addEventListener('pointermove', (event) => {
    if (reduceMotion.matches) {
      return;
    }

    const rect = consoleElement.getBoundingClientRect();
    consoleElement.style.setProperty('--ops-pointer-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
    consoleElement.style.setProperty('--ops-pointer-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
  });
  consoleElement.addEventListener('pointerleave', () => {
    consoleElement.style.setProperty('--ops-pointer-x', '50%');
    consoleElement.style.setProperty('--ops-pointer-y', '42%');
  });

  setMode('team');
}

function initOwnershipPath() {
  const path = document.querySelector('[data-ownership-path]');

  if (!path) {
    return;
  }

  const tabsContainer = path.querySelector('[data-ownership-tabs]');
  const stage = path.querySelector('[data-ownership-stage]');
  const panels = [...path.querySelectorAll('[data-ownership-panel]')];
  const compactLayout = window.matchMedia('(max-width: 719px)');

  if (!tabsContainer || !stage || !panels.length) {
    return;
  }

  let activeIndex = 0;
  const titles = panels.map((panel, index) => panel.querySelector('h3')?.textContent?.trim() || `Area ${index + 1}`);
  const tabButtons = panels.map((panel, index) => {
    const button = document.createElement('button');
    const number = document.createElement('span');
    const title = document.createElement('strong');
    const marker = document.createElement('i');

    button.className = 'ownership-path__step';
    button.type = 'button';
    button.id = `ownership-tab-${index + 1}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    number.textContent = String(index + 1).padStart(2, '0');
    title.textContent = titles[index];
    marker.setAttribute('aria-hidden', 'true');
    button.append(number, title, marker);

    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;

    return button;
  });

  const showArea = (index, { focusTab = false } = {}) => {
    const nextIndex = (index + panels.length) % panels.length;
    const activeChanged = nextIndex !== activeIndex;

    activeIndex = nextIndex;
    path.dataset.ownershipIndex = String(activeIndex + 1).padStart(2, '0');

    panels.forEach((panel, panelIndex) => {
      panel.hidden = panelIndex !== activeIndex;
    });
    tabButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;

      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    if (focusTab) {
      tabButtons[activeIndex]?.focus();
    }

    if (activeChanged && !reduceMotion.matches) {
      const activePanel = panels[activeIndex];

      animate(activePanel, {
        opacity: [0.4, 1],
        duration: 280,
        ease: 'outQuad',
        onComplete: () => activePanel.style.removeProperty('opacity'),
      });
    }
  };

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => showArea(index));
  });
  tabsContainer.replaceChildren(...tabButtons);

  const updateOrientation = () => {
    tabsContainer.setAttribute('aria-orientation', compactLayout.matches ? 'horizontal' : 'vertical');
  };

  updateOrientation();
  compactLayout.addEventListener('change', updateOrientation);

  tabsContainer.addEventListener('keydown', (event) => {
    let nextIndex;

    if (compactLayout.matches && event.key === 'ArrowLeft') {
      nextIndex = activeIndex - 1;
    } else if (compactLayout.matches && event.key === 'ArrowRight') {
      nextIndex = activeIndex + 1;
    } else if (compactLayout.matches && event.key === 'ArrowUp') {
      nextIndex = activeIndex - 2;
    } else if (compactLayout.matches && event.key === 'ArrowDown') {
      nextIndex = activeIndex + 2;
    } else if (!compactLayout.matches && event.key === 'ArrowUp') {
      nextIndex = activeIndex - 1;
    } else if (!compactLayout.matches && event.key === 'ArrowDown') {
      nextIndex = activeIndex + 1;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = panels.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    showArea(nextIndex, { focusTab: true });
  });

  path.classList.add('is-enhanced');
  showArea(0);
}

function initProjectStage() {
  const stage = document.querySelector('[data-project-stage]');

  if (!stage) {
    return;
  }

  const viewport = stage.querySelector('[data-project-viewport]');
  const tabsContainer = stage.querySelector('[data-project-tabs]');
  const panels = [...stage.querySelectorAll('[data-project-panel]')];
  const previousButton = stage.querySelector('[data-project-prev]');
  const nextButton = stage.querySelector('[data-project-next]');
  const currentLabel = stage.querySelector('[data-project-current]');
  const totalLabel = stage.querySelector('[data-project-total]');
  const nameStatus = stage.querySelector('[data-project-name-status]');

  if (!viewport || !tabsContainer || !panels.length) {
    return;
  }

  let activeIndex = 0;
  let swipePointerId = null;
  let swipeStartX = 0;
  const projectNames = panels.map((panel, index) => panel.querySelector('h3')?.textContent?.trim() || `Project ${index + 1}`);
  const tabButtons = panels.map((panel, index) => {
    const button = document.createElement('button');
    const number = document.createElement('span');
    const name = document.createElement('strong');

    button.className = 'project-stage__tab';
    button.type = 'button';
    button.id = `project-tab-${index + 1}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panel.id);
    number.textContent = String(index + 1).padStart(2, '0');
    name.textContent = projectNames[index];
    button.append(number, name);

    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);

    return button;
  });

  const showProject = (index, { focusTab = false } = {}) => {
    const nextIndex = Math.min(Math.max(index, 0), panels.length - 1);
    const activeChanged = nextIndex !== activeIndex;

    activeIndex = nextIndex;

    if (currentLabel) {
      currentLabel.textContent = String(activeIndex + 1).padStart(2, '0');
    }
    if (totalLabel) {
      totalLabel.textContent = String(panels.length).padStart(2, '0');
    }
    if (nameStatus) {
      nameStatus.textContent = projectNames[activeIndex];
    }

    panels.forEach((panel, panelIndex) => {
      panel.hidden = panelIndex !== activeIndex;
      panel.dataset.projectIndex = String(panelIndex + 1).padStart(2, '0');
    });
    tabButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeIndex;

      button.setAttribute('aria-selected', String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });

    if (previousButton) {
      previousButton.disabled = activeIndex === 0;
    }
    if (nextButton) {
      nextButton.disabled = activeIndex === panels.length - 1;
    }
    if (focusTab) {
      tabButtons[activeIndex]?.focus();
    }

    if (activeChanged && !reduceMotion.matches) {
      const activePanel = panels[activeIndex];

      animate(activePanel, {
        opacity: [0.45, 1],
        duration: 320,
        ease: 'outQuad',
        onComplete: () => activePanel.style.removeProperty('opacity'),
      });
    }
  };

  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => showProject(index));
  });
  tabsContainer.replaceChildren(...tabButtons);

  tabsContainer.addEventListener('keydown', (event) => {
    let nextIndex;

    if (event.key === 'ArrowLeft') {
      nextIndex = (activeIndex - 1 + panels.length) % panels.length;
    } else if (event.key === 'ArrowRight') {
      nextIndex = (activeIndex + 1) % panels.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = panels.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    showProject(nextIndex, { focusTab: true });
  });

  previousButton?.addEventListener('click', () => showProject(activeIndex - 1));
  nextButton?.addEventListener('click', () => showProject(activeIndex + 1));

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showProject(activeIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showProject(activeIndex + 1);
    }
  });

  viewport.addEventListener('dragstart', (event) => event.preventDefault());
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    swipePointerId = event.pointerId;
    swipeStartX = event.clientX;
  });

  const finishSwipe = (event) => {
    if (event.pointerId !== swipePointerId) {
      return;
    }

    const distance = event.clientX - swipeStartX;
    swipePointerId = null;

    if (Math.abs(distance) >= 48) {
      showProject(activeIndex + (distance < 0 ? 1 : -1));
    }
  };

  viewport.addEventListener('pointerup', finishSwipe);
  viewport.addEventListener('pointercancel', () => {
    swipePointerId = null;
  });

  stage.classList.add('is-enhanced');
  showProject(0);
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
  const activeSectionJump = sectionJumpLinks.find((link) => link.hash === `#${activeSection.id}`);

  sections.forEach((section) => {
    section.classList.toggle('is-active-section', section === activeSection);
  });

  navLinks.forEach((link) => {
    link.toggleAttribute('aria-current', link === activeLink);
  });
  sectionJumpLinks.forEach((link) => {
    if (link === activeSectionJump) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  moveIndicator(activeLink);

  const sectionPosition = sections.indexOf(activeSection);
  const activeSectionLabel = sectionLabels[activeSection.id] ?? activeSection.id;
  if (sectionIndexCurrent) {
    sectionIndexCurrent.textContent = String(sectionPosition + 1).padStart(2, '0');
  }
  if (sectionIndexLabel) {
    sectionIndexLabel.textContent = activeSectionLabel;
  }
  if (sectionIndexToggle?.getAttribute('aria-expanded') !== 'true') {
    sectionIndexToggle?.setAttribute('aria-label', `Open section navigator, current section ${activeSectionLabel}`);
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

initOperationsConsole();
initOwnershipPath();
initProjectStage();
updateActiveNav();
updateScrollProgress();
