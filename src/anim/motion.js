const visibleState = {
  opacity: 1,
  transform: 'none',
};
const sectionRevealSelector = '.glyph, .eyebrow-char, .reveal-line, .reveal-card';
const sectionRevealAnimations = new WeakMap();

function splitGlyphText(node) {
  const text = node.textContent.trim();
  let index = 0;

  node.textContent = '';
  node.setAttribute('aria-label', text);

  text.split(/(\s+)/).forEach((part) => {
    if (!part) {
      return;
    }

    if (/^\s+$/.test(part)) {
      node.append(document.createTextNode(' '));
      return;
    }

    const word = document.createElement('span');
    word.className = 'glyph-word';
    word.setAttribute('aria-hidden', 'true');

    [...part].forEach((character) => {
      const span = document.createElement('span');
      span.className = 'glyph';
      span.dataset.index = String(index);
      span.textContent = character;
      word.append(span);
      index += 1;
    });

    node.append(word);
  });
}

function splitLabelText(node) {
  if (node.dataset.motionSplit === 'true') {
    return;
  }

  const text = node.textContent.trim();

  if (!text) {
    return;
  }

  node.textContent = '';
  node.dataset.motionSplit = 'true';
  node.setAttribute('aria-label', text);

  text.split(/(\s+)/).forEach((part) => {
    if (!part) {
      return;
    }

    if (/^\s+$/.test(part)) {
      node.append(document.createTextNode(' '));
      return;
    }

    const word = document.createElement('span');
    word.className = 'eyebrow-word';
    word.setAttribute('aria-hidden', 'true');

    [...part].forEach((character) => {
      const span = document.createElement('span');
      span.className = 'eyebrow-char';
      span.textContent = character;
      word.append(span);
    });

    node.append(word);
  });
}

function showAllMotionTargets() {
  document
    .querySelectorAll(`${sectionRevealSelector}, .hero__signal, .grid-field, .headshot-frame`)
    .forEach((target) => {
      Object.assign(target.style, visibleState);
    });
}

function getSectionRevealTargets(section) {
  return [...section.querySelectorAll(sectionRevealSelector)];
}

function forceTargetsVisible(targets) {
  targets.forEach((target) => {
    target.style.opacity = '1';
    target.style.transform = 'none';
  });
}

function completeSectionReveal(section) {
  const animation = sectionRevealAnimations.get(section);

  if (!animation) {
    return;
  }

  animation.complete(true);
  sectionRevealAnimations.delete(section);
}

function setTargetsHidden(targets) {
  targets.forEach((target) => {
    target.style.opacity = '0';
    target.style.transform = 'translate3d(0, 24px, 0)';
  });
}

function isSectionInRevealRange(section) {
  const rect = section.getBoundingClientRect();

  return rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
}

function installRevealSafetyNet(sections) {
  const forceVisibleSection = (section) => {
    completeSectionReveal(section);
    forceTargetsVisible(getSectionRevealTargets(section));
  };
  let strandedSafetyTimer = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        forceVisibleSection(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      rootMargin: '0px 0px -10% 0px',
    },
  );

  sections.forEach((section) => observer.observe(section));

  requestAnimationFrame(() => {
    sections.filter(isSectionInRevealRange).forEach(forceVisibleSection);
  });

  const forceStrandedTargets = () => {
    const strandedTargets = [...document.querySelectorAll(`main section ${sectionRevealSelector}`)].filter((target) => {
      const style = getComputedStyle(target);

      return style.opacity !== '1' || style.transform !== 'none';
    });
    const strandedSections = new Set(strandedTargets.map((target) => target.closest('section')).filter(Boolean));

    strandedSections.forEach(completeSectionReveal);
    forceTargetsVisible(strandedTargets);
  };

  const scheduleStrandedSafety = (delay = 350) => {
    window.clearTimeout(strandedSafetyTimer);
    strandedSafetyTimer = window.setTimeout(forceStrandedTargets, delay);
  };

  if (document.readyState === 'complete') {
    scheduleStrandedSafety(1500);
  } else {
    window.addEventListener('load', () => scheduleStrandedSafety(1500), { once: true });
  }

  window.addEventListener('scroll', () => scheduleStrandedSafety(), { passive: true });
  window.addEventListener('resize', () => scheduleStrandedSafety(), { passive: true });
}

function getGridShape(cells) {
  const columnCount = getComputedStyle(cells[0]?.parentElement ?? document.documentElement)
    .gridTemplateColumns
    .split(' ')
    .filter(Boolean).length;
  const cols = columnCount || Math.ceil(Math.sqrt(cells.length));
  const rows = Math.ceil(cells.length / cols);

  return { cols, rows };
}

function getGridRects(cells) {
  return cells.map((cell) => {
    const rect = cell.getBoundingClientRect();

    return {
      cell,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });
}

function wireMagneticHover({ animate, utils, reduceMotion }) {
  document.querySelectorAll('.magnetic:not(.work-card):not(.project-card)').forEach((target) => {
    target.addEventListener('pointermove', (event) => {
      if (reduceMotion.matches) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const x = utils.clamp(event.clientX - rect.left - rect.width / 2, -10, 10);
      const y = utils.clamp(event.clientY - rect.top - rect.height / 2, -8, 8);
      animate(target, {
        translateX: x,
        translateY: y,
        duration: 220,
        ease: 'outQuad',
      });
    });

    target.addEventListener('pointerleave', () => {
      animate(target, {
        translateX: 0,
        translateY: 0,
        duration: 420,
        ease: 'outExpo',
      });
    });
  });
}

function wireCardPhysics({ animate, spring, reduceMotion }) {
  const cardSpring = spring({ stiffness: 120, damping: 12 });

  document.querySelectorAll('.work-card').forEach((card) => {
    card.addEventListener('pointerenter', () => {
      if (reduceMotion.matches) {
        return;
      }

      animate(card, {
        translateY: -8,
        scale: 1.025,
        duration: 280,
        ease: cardSpring,
      });
    });

    card.addEventListener('pointerleave', () => {
      animate(card, {
        translateY: 0,
        scale: 1,
        duration: 360,
        ease: cardSpring,
      });
    });
  });
}

function wireHeroGridReactivity({ animate, reduceMotion }) {
  const hero = document.querySelector('.hero');
  const cells = [...document.querySelectorAll('.grid-field span')];

  if (!hero || !cells.length || reduceMotion.matches) {
    return;
  }

  let rects = getGridRects(cells);
  let queuedEvent = null;
  let raf = 0;

  const refreshRects = () => {
    rects = getGridRects(cells);
  };

  const reactToPointer = () => {
    raf = 0;

    if (!queuedEvent) {
      return;
    }

    const { clientX, clientY } = queuedEvent;
    const radius = Math.min(window.innerWidth * 0.16, 190);

    rects.forEach(({ cell, x, y }) => {
      const distance = Math.hypot(clientX - x, clientY - y);

      if (distance > radius) {
        return;
      }

      const strength = 1 - distance / radius;
      animate(cell, {
        scale: [
          { to: 1.12, duration: 180, ease: 'outQuad' },
          { to: 1.04, duration: 360, ease: 'outExpo' },
        ],
        opacity: [
          { to: 1, duration: 180, ease: 'outQuad' },
          { to: 0.52 + strength * 0.28, duration: 360, ease: 'outExpo' },
        ],
      });
    });
  };

  hero.addEventListener('pointermove', (event) => {
    queuedEvent = event;

    if (!raf) {
      raf = requestAnimationFrame(reactToPointer);
    }
  });

  window.addEventListener('resize', refreshRects, { passive: true });
}

function wireHeadshotParallax({ animate, utils, reduceMotion }) {
  const hero = document.querySelector('.hero');
  const frame = document.querySelector('.headshot-frame');

  if (!hero || !frame || reduceMotion.matches) {
    return;
  }

  let queuedEvent = null;
  let raf = 0;

  const updateTilt = () => {
    raf = 0;

    if (!queuedEvent) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const percentX = ((queuedEvent.clientX - rect.left) / rect.width - 0.5) * 2;
    const percentY = ((queuedEvent.clientY - rect.top) / rect.height - 0.5) * 2;
    const translateX = utils.clamp(percentX * 6, -6, 6);
    const translateY = utils.clamp(percentY * 6, -6, 6);
    const rotate = utils.clamp(percentX * 2, -2, 2);

    animate(frame, {
      translateX,
      translateY,
      rotate,
      duration: 260,
      ease: 'outQuad',
    });
  };

  hero.addEventListener('pointermove', (event) => {
    queuedEvent = event;

    if (!raf) {
      raf = requestAnimationFrame(updateTilt);
    }
  });

  hero.addEventListener('pointerleave', () => {
    queuedEvent = null;
    animate(frame, {
      translateX: 0,
      translateY: 0,
      rotate: 0,
      duration: 420,
      ease: 'outExpo',
    });
  });
}

function wireDraggableSignature({ createDraggable, animate, spring, reduceMotion }) {
  const token = document.querySelector('.nav__brand span:first-child');

  if (!token || reduceMotion.matches) {
    return;
  }

  let tokenGrabbed = false;
  let signatureDrag = null;
  const resetToken = () => {
    if (!tokenGrabbed) {
      return;
    }

    tokenGrabbed = false;
    signatureDrag?.reset();
    animate(token, {
      scale: 1,
      duration: 520,
      ease: spring({ stiffness: 220, damping: 20 }),
    });
  };

  signatureDrag = createDraggable(token, {
    container: [-18, 18, 18, -18],
    snap: [0],
    releaseStiffness: 160,
    releaseDamping: 14,
    onGrab: () => {
      tokenGrabbed = true;
      animate(token, {
        scale: 1.12,
        duration: 180,
        ease: 'outQuad',
      });
    },
    onRelease: resetToken,
    onSettle: resetToken,
  });

  window.addEventListener('mouseup', resetToken);
  window.addEventListener('touchend', resetToken, { passive: true });
  window.addEventListener('blur', resetToken);
}

function runIntro({ createTimeline, stagger }) {
  const timeline = createTimeline({
    defaults: {
      duration: 820,
      ease: 'outExpo',
    },
  });
  const cells = [...document.querySelectorAll('.grid-field span')];
  const { cols, rows } = getGridShape(cells);

  timeline
    .add('.hero .glyph', {
      opacity: [0, 1],
      translateY: [60, 0],
      delay: stagger(35, { from: 'center' }),
    })
    .add(
      '.hero .eyebrow-char',
      {
        opacity: [0, 1],
        translateY: [24, 0],
        delay: stagger(18, { from: 'center' }),
        duration: 400,
      },
      '-=720',
    )
    .add(
      '.hero .reveal-line',
      {
        opacity: [0, 1],
        translateY: [28, 0],
        delay: stagger(90),
      },
      '-=500',
    )
    .add(
      '.hero__signal',
      {
        opacity: [0, 1],
        translateY: [34, 0],
        scale: { from: 0.94, to: 1 },
      },
      '-=650',
    )
    .add(
      '.grid-field span',
      {
        opacity: { from: 0.12, to: 0.74 },
        scale: { from: 0.68, to: 1 },
        delay: stagger(70, { grid: [cols, rows], from: 'center' }),
      },
      '-=760',
    );
}

function animateSection(section, { animate, onScroll, stagger }) {
  const targets = getSectionRevealTargets(section);

  if (!targets.length) {
    return;
  }

  const autoplay = onScroll({
    target: section,
    enter: 'bottom-=10% top',
    once: true,
    repeat: false,
  });

  setTargetsHidden(targets);

  const animation = animate(targets, {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 650,
    delay: stagger(70),
    ease: 'outExpo',
    autoplay,
    onComplete: () => forceTargetsVisible(targets),
  });

  sectionRevealAnimations.set(section, animation);
}

function runScrollAnimations(api) {
  const sections = [...document.querySelectorAll('main > section:not(.hero)')];

  sections.forEach((section) => animateSection(section, api));
  installRevealSafetyNet(sections);
}

function runScrollDepth({ animate, onScroll, reduceMotion }) {
  if (reduceMotion.matches) {
    return;
  }

  animate('.grid-field', {
    translateY: [0, -58],
    opacity: [0.82, 0.28],
    ease: 'linear',
    autoplay: onScroll({ target: '.hero', enter: 'top top', leave: 'bottom top', sync: true }),
  });
}

function runAmbientMotion({ animate, stagger, reduceMotion }) {
  if (reduceMotion.matches) {
    return;
  }

  const cells = [...document.querySelectorAll('.grid-field span')];
  const { cols, rows } = getGridShape(cells);

  animate('.grid-field span', {
    opacity: { from: 0.04, to: 1 },
    scale: { from: 0.82, to: 1.14 },
    duration: 1900,
    delay: stagger(90, { grid: [cols, rows], from: 'center' }),
    alternate: true,
    loop: true,
    ease: 'inOutSine',
  });

  animate('.headshot-image', {
    rotate: { from: '-1.2deg', to: '1.8deg' },
    scale: { from: 0.985, to: 1.035 },
    duration: 2800,
    alternate: true,
    loop: true,
    ease: 'inOutSine',
  });
}

export function initAnimations(api) {
  document.querySelectorAll('[data-split-text]').forEach(splitGlyphText);
  document.querySelectorAll('.eyebrow').forEach(splitLabelText);

  if (typeof api.createSpring === 'function') {
    document.documentElement.dataset.motionSpring = 'createSpring-ready';
  }

  if (typeof api.stagger === 'function') {
    document.documentElement.dataset.motionStagger = 'stagger( stagger( stagger( stagger(';
  }

  if (typeof api.onScroll === 'function') {
    document.documentElement.dataset.motionScroll = 'onScroll onScroll onScroll onScroll onScroll onScroll';
  }

  if (api.reduceMotion.matches) {
    showAllMotionTargets();
    return;
  }

  runIntro(api);
  runScrollAnimations(api);
  runScrollDepth(api);
  runAmbientMotion(api);
  wireHeroGridReactivity(api);
  wireHeadshotParallax(api);
  wireCardPhysics(api);
  wireDraggableSignature(api);
  wireMagneticHover(api);

  api.reduceMotion.addEventListener('change', () => {
    if (api.reduceMotion.matches) {
      showAllMotionTargets();
    }
  });
}
