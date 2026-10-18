import test from 'node:test';
import assert from 'node:assert/strict';
import { initImageViewer } from '../src/image-viewer.js';

function element() {
  const node = new EventTarget();
  const attributes = new Map();
  const classes = new Set();
  node.setAttribute = (name, value) => attributes.set(name, value);
  node.getAttribute = (name) => attributes.get(name);
  node.classList = {
    add: (name) => classes.add(name),
    remove: (name) => classes.delete(name),
    contains: (name) => classes.has(name),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
  };
  node.querySelector = () => null;
  return node;
}

function fixture({ supported = true } = {}) {
  const dialog = element();
  const image = element();
  const zoom = element();
  const original = element();
  const canvas = element();
  canvas.focus = (options) => { canvas.focusOptions = options; };
  const link = element();
  const body = element();
  const children = { img: image, '[data-image-zoom]': zoom, '[data-image-original]': original, '[data-image-canvas]': canvas };
  dialog.querySelector = (selector) => children[selector];
  dialog.getBoundingClientRect = () => ({ left: 10, top: 10, right: 200, bottom: 200 });
  dialog.close = () => {
    dialog.open = false;
    dialog.dispatchEvent(new Event('close'));
  };
  if (supported) dialog.showModal = () => { dialog.open = true; };
  link.href = 'https://example.com/missionboard.png';
  link.querySelector = () => ({ alt: 'MissionBoard preview' });
  link.focus = (options) => { link.focusOptions = options; };
  const root = {
    body,
    querySelector: () => dialog,
    querySelectorAll: () => [link],
  };
  initImageViewer(root);
  return { dialog, image, zoom, original, canvas, link, body };
}

function click(target, properties = {}) {
  const event = new Event('click', { cancelable: true });
  Object.assign(event, { button: 0, ...properties });
  target.dispatchEvent(event);
  return event;
}

test('opens the selected image and preserves its accessible description', () => {
  const { link, dialog, image, original, body } = fixture();
  assert.equal(click(link).defaultPrevented, true);
  assert.equal(dialog.open, true);
  assert.equal(image.src, link.href);
  assert.equal(original.href, link.href);
  assert.equal(image.alt, 'MissionBoard preview');
  assert.equal(body.classList.contains('image-viewer-open'), true);
});

test('modified clicks and unsupported dialogs preserve normal link navigation', () => {
  for (const modifier of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey']) {
    const { link, dialog } = fixture();
    assert.equal(click(link, { [modifier]: true }).defaultPrevented, false);
    assert.equal(dialog.open, undefined);
  }
  assert.equal(click(fixture().link, { button: 1 }).defaultPrevented, false);
  assert.equal(click(fixture({ supported: false }).link).defaultPrevented, false);
});

test('zoom updates its state and resets scroll when fitting the image', () => {
  const { link, zoom, canvas } = fixture();
  click(link);
  click(zoom);
  assert.equal(zoom.getAttribute('aria-pressed'), 'true');
  assert.equal(canvas.classList.contains('is-zoomed'), true);
  assert.equal(canvas.tabIndex, 0);
  assert.deepEqual(canvas.focusOptions, { preventScroll: true });
  assert.equal(zoom.textContent, 'Fit image');
  canvas.scrollLeft = 200;
  canvas.scrollTop = 100;
  click(zoom);
  assert.equal(canvas.classList.contains('is-zoomed'), false);
  assert.equal(canvas.tabIndex, -1);
  assert.equal(canvas.scrollLeft, 0);
  assert.equal(canvas.scrollTop, 0);
});

test('closing restores focus and scrolling and clears zoom for the next visit', () => {
  const { link, dialog, zoom, body } = fixture();
  click(link);
  click(zoom);
  dialog.close();
  assert.equal(body.classList.contains('image-viewer-open'), false);
  assert.deepEqual(link.focusOptions, { preventScroll: true });
  click(link);
  assert.equal(zoom.getAttribute('aria-pressed'), 'false');
});

test('only a backdrop click closes the viewer', () => {
  const { link, dialog } = fixture();
  click(link);
  click(dialog, { clientX: 50, clientY: 50 });
  assert.equal(dialog.open, true);
  click(dialog, { clientX: 0, clientY: 0 });
  assert.equal(dialog.open, false);
});

test('missing viewer markup leaves the page alone', () => {
  assert.doesNotThrow(() => initImageViewer({ querySelector: () => null }));
});
