export function initImageViewer(root = document) {
  const dialog = root.querySelector('[data-image-viewer]');
  const image = dialog?.querySelector('img');
  const zoom = dialog?.querySelector('[data-image-zoom]');
  const original = dialog?.querySelector('[data-image-original]');
  const canvas = dialog?.querySelector('[data-image-canvas]');

  if (!image || !zoom || !original || !canvas || typeof dialog.showModal !== 'function') {
    return;
  }

  let opener;
  const setZoom = (isZoomed) => {
    canvas.classList.toggle('is-zoomed', isZoomed);
    zoom.setAttribute('aria-pressed', String(isZoomed));
    zoom.textContent = isZoomed ? 'Fit image' : 'Zoom in';
    canvas.scrollTop = 0;
    canvas.scrollLeft = 0;
    canvas.tabIndex = isZoomed ? 0 : -1;
    if (isZoomed) canvas.focus({ preventScroll: true });
  };

  root.querySelectorAll('[data-image-preview]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      image.src = link.href;
      image.alt = link.querySelector('img')?.alt || 'MissionBoard';
      original.href = link.href;
      opener = link;
      setZoom(false);
      dialog.showModal();
      root.body.classList.add('image-viewer-open');
      event.preventDefault();
    });
  });

  zoom.addEventListener('click', () => setZoom(zoom.getAttribute('aria-pressed') !== 'true'));
  dialog.addEventListener('close', () => {
    root.body.classList.remove('image-viewer-open');
    setZoom(false);
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });
}
