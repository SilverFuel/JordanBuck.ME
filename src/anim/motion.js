const visibleState = {
  opacity: 1,
  transform: 'none',
};

const majorSections = [
  { selector: '#about', trigger: '#about' },
  { selector: '#work', trigger: '#work' },
  { selector: '#projects', trigger: '#projects' },
  { selector: '#skills', trigger: '#skills' },
  { selector: '#recommendations', trigger: '#recommendations' },
  { selector: '#contact', trigger: '#contact' },
];

function splitGlyphText(node) {
  const text = node.textContent.trim();
  node.textContent = '';
  node.setAttribute('aria-label', text);

  [...text].forEach((character, index) => {
    const span = document.createElement('span');
    span.className = 'glyph';
    span.dataset.index = String(index);
    span.setAttribute('aria-hidden', 'true');
    span.textContent = character === ' ' ? '\u00a0' : character;
    node.append(span);
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

  [...text].forEach((character) => {
    const span = document.createElement('span');
    span.className = 'eyebrow-char';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = character === ' ' ? '\u00a0' : character;
    node.append(span);
  });
}

function showAllMotionTargets() {
  document
    .querySelectorAll('.glyph, .eyebrow-char, .reveal-line, .reveal-card, .hero__signal, .grid-field')
    .forEach((target) => {
      Object.assign(target.style, visibleState);
    });
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

  document.querySelectorAll('.work-card, .project-card').forEach((card) => {
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

function animateSection(selector, trigger, { animate, onScroll, stagger }) {
  animate(`${selector} .glyph, ${selector} .reveal-line, ${selector} .reveal-card`, {
    opacity: [0, 1],
    translateY: [28, 0],
    duration: 650,
    delay: stagger(70),
    ease: 'outExpo',
    autoplay: onScroll({ target: trigger, enter: 'bottom-=80 top', once: true }),
  });

  animate(`${selector} .eyebrow-char`, {
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 400,
    delay: stagger(18),
    ease: 'outExpo',
    autoplay: onScroll({ target: trigger, enter: 'bottom-=80 top', once: true }),
  });
}

function runScrollAnimations(api) {
  majorSections.forEach(({ selector, trigger }) => {
    animateSection(selector, trigger, api);
  });
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
  document
    .querySelectorAll('.eyebrow, .signal-card__label, .metric-card span, .contact-link span')
    .forEach(splitLabelText);

  if (typeof api.createSpring === 'function') {
    document.documentElement.dataset.motionSpring = 'createSpring-ready';
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
  wireCardPhysics(api);
  wireDraggableSignature(api);
  wireMagneticHover(api);

  api.reduceMotion.addEventListener('change', () => {
    if (api.reduceMotion.matches) {
      showAllMotionTargets();
    }
  });
}
