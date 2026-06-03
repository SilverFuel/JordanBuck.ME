const visibleState = {
  opacity: 1,
  transform: 'none',
};

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

function showAllMotionTargets() {
  document.querySelectorAll('.glyph, .reveal-line, .reveal-card').forEach((target) => {
    Object.assign(target.style, visibleState);
  });
}

function wireMagneticHover({ animate, utils, reduceMotion }) {
  document.querySelectorAll('.magnetic').forEach((target) => {
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

function runIntro({ createTimeline, stagger }) {
  const timeline = createTimeline({
    defaults: {
      duration: 840,
      ease: 'outExpo',
    },
  });

  timeline
    .add('.hero .glyph', {
      opacity: [0, 1],
      translateY: [42, 0],
      rotateX: { from: '-50deg', to: '0deg' },
      delay: stagger(18, { from: 'center' }),
    })
    .add(
      '.hero .reveal-line',
      {
        opacity: [0, 1],
        translateY: [22, 0],
        delay: stagger(80),
      },
      '-=520',
    )
    .add(
      '.hero__signal',
      {
        opacity: [0, 1],
        translateY: [18, 0],
        scale: { from: 0.96, to: 1 },
      },
      '-=680',
    )
    .add(
      '.grid-field span',
      {
        opacity: [0.12, 0.8],
        scale: { from: 0.4, to: 1 },
        delay: stagger(35, { from: 'center' }),
      },
      '-=760',
    );
}

function runScrollAnimations({ animate, onScroll, stagger }) {
  animate('.section:not(.hero) .glyph', {
    opacity: [0, 1],
    translateY: [28, 0],
    delay: stagger(12),
    duration: 620,
    ease: 'outExpo',
    autoplay: onScroll({ enter: 'bottom-=100 top' }),
  });

  animate('.section:not(.hero) .reveal-line', {
    opacity: [0, 1],
    translateY: [18, 0],
    duration: 560,
    ease: 'outExpo',
    autoplay: onScroll({ enter: 'bottom-=80 top' }),
  });

  animate('.section:not(.hero) .reveal-card', {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 660,
    delay: stagger(70),
    ease: 'outExpo',
    autoplay: onScroll({ enter: 'bottom-=100 top' }),
  });
}

function runAmbientMotion({ animate, stagger, reduceMotion }) {
  if (reduceMotion.matches) {
    return;
  }

  animate('.grid-field span', {
    opacity: [0.18, 0.78],
    scale: [0.82, 1.12],
    duration: 4800,
    delay: stagger(140, { from: 'center', reversed: true }),
    alternate: true,
    loop: true,
    ease: 'inOutQuad',
  });

  animate('.headshot-image', {
    rotate: { from: '-0.8deg', to: '1.5deg' },
    scale: { from: 0.995, to: 1.01 },
    duration: 5200,
    alternate: true,
    loop: true,
    ease: 'inOutQuad',
  });
}

export function initAnimations(api) {
  document.querySelectorAll('[data-split-text]').forEach(splitGlyphText);

  if (api.reduceMotion.matches) {
    showAllMotionTargets();
    return;
  }

  runIntro(api);
  runScrollAnimations(api);
  runAmbientMotion(api);
  wireMagneticHover(api);

  api.reduceMotion.addEventListener('change', () => {
    if (api.reduceMotion.matches) {
      showAllMotionTargets();
    }
  });
}
