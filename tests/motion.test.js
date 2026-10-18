import test from 'node:test';
import assert from 'node:assert/strict';
import { initAnimations } from '../src/anim/motion.js';

test('reduced motion shows all reveal targets without starting animation', () => {
  const targets = Array.from({ length: 4 }, () => ({ style: { opacity: '0', transform: 'translateY(24px)' } }));
  const originalDocument = globalThis.document;
  globalThis.document = {
    querySelectorAll: (selector) => selector.startsWith('.glyph,') ? targets : [],
  };
  try {
    initAnimations({
      reduceMotion: { matches: true },
      animate: () => assert.fail('Animation must not start with reduced motion'),
    });
    targets.forEach(({ style }) => assert.deepEqual(style, { opacity: 1, transform: 'none' }));
  } finally {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  }
});
