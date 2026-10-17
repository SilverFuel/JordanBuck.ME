import './styles/missionboard.css';

export function initMissionBoardExplorer() {
  const explorer = document.querySelector('[data-mission-explorer]');
  if (!explorer) return;

  const tabs = [...explorer.querySelectorAll('[data-mission-tab]')];
  const scenes = [...explorer.querySelectorAll('[data-mission-scene]')];
  const tablist = explorer.querySelector('[data-mission-tabs]');
  const controls = explorer.querySelector('[data-mission-controls]');
  const previous = explorer.querySelector('[data-mission-prev]');
  const next = explorer.querySelector('[data-mission-next]');
  const status = explorer.querySelector('[data-mission-status]');
  if (!scenes.length || tabs.length !== scenes.length || !tablist || !controls || !previous || !next || !status) return;

  let activeIndex = 0;
  const wrap = index => (index + scenes.length) % scenes.length;
  const label = index => `${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')} · ${scenes[index].dataset.missionName}`;
  const show = (index, focusTab = false) => {
    activeIndex = wrap(index);
    const disablingFocusedBack = activeIndex === 0 && document.activeElement === previous;
    scenes.forEach((scene, i) => {
      scene.hidden = i !== activeIndex;
      scene.setAttribute('role', 'tabpanel');
      scene.setAttribute('aria-labelledby', tabs[i].id);
    });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === activeIndex));
      tab.tabIndex = i === activeIndex ? 0 : -1;
    });
    previous.disabled = activeIndex === 0;
    next.textContent = activeIndex === scenes.length - 1 ? 'Back to start ↺' : 'Next view →';
    status.textContent = label(activeIndex);
    if (focusTab) tabs[activeIndex].focus();
    else if (disablingFocusedBack) next.focus({ preventScroll: true });
  };

  tabs.forEach((tab, index) => tab.addEventListener('click', () => show(index)));
  tablist.addEventListener('keydown', event => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const destinations = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: scenes.length - 1 };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    show(destinations[event.key], true);
  });
  previous.addEventListener('click', () => show(activeIndex - 1));
  next.addEventListener('click', () => show(activeIndex + 1));
  tablist.hidden = false;
  controls.hidden = false;
  show(0);

  const dialog = document.querySelector('[data-mission-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const viewport = dialog.querySelector('[data-mission-dialog-viewport]');
  const image = dialog.querySelector('[data-mission-dialog-image]');
  const title = dialog.querySelector('[data-mission-dialog-title]');
  const dialogStatus = dialog.querySelector('[data-mission-dialog-status]');
  const zoom = dialog.querySelector('[data-mission-zoom]');
  let dialogIndex = 0;
  let opener = null;
  let zoomed = false;

  const setZoom = value => {
    zoomed = value;
    viewport.classList.toggle('is-zoomed', zoomed);
    zoom.setAttribute('aria-pressed', String(zoomed));
    zoom.textContent = zoomed ? 'Fit image' : 'Zoom in';
    viewport.scrollTo(0, 0);
  };
  const showScreenshot = index => {
    dialogIndex = wrap(index);
    const source = scenes[dialogIndex].querySelector('[data-mission-image] img');
    image.src = source.src;
    image.alt = source.alt;
    image.width = Number(source.getAttribute('width'));
    image.height = Number(source.getAttribute('height'));
    title.textContent = scenes[dialogIndex].dataset.missionName;
    dialogStatus.textContent = `${dialogIndex + 1} of ${scenes.length}`;
    setZoom(false);
  };
  scenes.forEach((scene, index) => {
    scene.querySelector('[data-mission-image]').addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = event.currentTarget;
      showScreenshot(index);
      dialog.showModal();
      document.body.classList.add('mission-viewer-open');
    });
  });
  dialog.querySelector('[data-mission-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-mission-dialog-prev]').addEventListener('click', () => showScreenshot(dialogIndex - 1));
  dialog.querySelector('[data-mission-dialog-next]').addEventListener('click', () => showScreenshot(dialogIndex + 1));
  zoom.addEventListener('click', () => setZoom(!zoomed));
  dialog.addEventListener('keydown', event => {
    if (zoomed || event.altKey || event.ctrlKey || event.metaKey) return;
    const destinations = { ArrowLeft: dialogIndex - 1, ArrowRight: dialogIndex + 1, Home: 0, End: scenes.length - 1 };
    if (!Object.hasOwn(destinations, event.key)) return;
    event.preventDefault();
    showScreenshot(destinations[event.key]);
  });
  let backdropPress = false;
  dialog.addEventListener('pointerdown', event => { backdropPress = event.target === dialog; });
  dialog.addEventListener('pointercancel', () => { backdropPress = false; });
  dialog.addEventListener('click', event => {
    if (backdropPress && event.target === dialog) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('mission-viewer-open');
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
}
