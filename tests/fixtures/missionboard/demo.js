import { sampleWork } from './sample-data.js';

const view = document.getElementById('demo-view');
const main = document.getElementById('main');
const views = {
  overview: { title: 'Overview', description: 'Projects, owners, blockers, and the next action — together.', items: sampleWork },
  attention: { title: 'Needs Attention', description: 'Start with stopped work, delivery risk, and a missing owner.', items: sampleWork.filter(item => item.attention) },
  projects: { title: 'Projects', description: 'See each project’s current status, owner, and next action.', items: sampleWork.filter(item => item.type === 'Project') }
};
let returnRoute = '#overview';
let currentList = 'overview';
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const badge = item => `<span class="demo-status ${escape(item.tone)}"><span class="status-dot" aria-hidden="true"></span>${escape(item.status)}</span>`;
const person = item => `<span class="person"><span class="avatar ${item.owner === 'Unassigned' ? 'unassigned' : ''}" aria-hidden="true">${escape(item.initials)}</span><span>${escape(item.owner)}</span></span>`;
const itemLink = id => `#work/${encodeURIComponent(id)}`;

function selectedView(name) {
  document.querySelectorAll('[data-view]').forEach(link => {
    const active = link.dataset.view === name;
    link.parentElement.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function options(values, all) {
  return `<option value="">${all}</option>${[...new Set(values)].sort().map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('')}`;
}

function card(item) {
  return `<article class="work-item ${escape(item.tone)}">
    <div class="work-summary"><div class="work-meta"><span>${escape(item.type)}</span><span aria-hidden="true">·</span><span>${escape(item.group)}</span></div>
      <h3><a href="${itemLink(item.id)}">${escape(item.title)}<span aria-hidden="true" class="link-arrow">↗</span></a></h3>
      <p class="work-issue">${escape(item.issue)}</p>
      ${item.escalated ? '<span class="context-label">Manual escalation · See update</span>' : item.owner === 'Unassigned' ? '<span class="context-label owner-needed">Missing owner · Decision needed</span>' : ''}
    </div>
    <div class="work-owner"><span class="mobile-label">Owner</span>${person(item)}${badge(item)}</div>
    <div class="work-next"><span class="small-label">${item.type !== 'Project' ? 'Next step · From task notes' : 'Next action'}</span><p>${escape(item.next)}</p><span class="work-date">Due ${escape(item.due.replace(', 2026', ''))}</span></div>
  </article>`;
}

function renderList(name, params) {
  const config = views[name];
  currentList = name;
  selectedView(name);
  document.title = `${config.title} · Mission-Board demo`;
  const total = sampleWork.length;
  view.innerHTML = `<div class="demo-page-heading"><div><p class="eyebrow">Cedarfield Workshop / Sample workspace</p><h1 tabindex="-1">${config.title}</h1><p class="page-description">${config.description}</p></div><span class="read-only-label">Read-only view</span></div>
    ${name === 'overview' ? `<section class="tour-strip" aria-label="Suggested 60-second tour"><div><span class="small-label">Explore in 60–90 seconds</span><p>See what’s moving.<br><strong>Find what needs a decision.</strong></p></div><ol><li><a href="#attention"><span>01</span>Find the risk</a></li><li><a href="#work/service-desk-move"><span>02</span>Open a blocker</a></li><li><a href="#work/pilot-window"><span>03</span>Spot the missing owner</a></li></ol></section>` : ''}
    <section class="demo-metrics" aria-label="Featured sample work counts">
      <div class="demo-metric"><span class="metric-label">Featured work</span><strong>${total}<small>3 projects · 1 action item</small></strong></div>
      <div class="demo-metric metric-blocked"><span class="metric-label">Blocked</span><strong>${sampleWork.filter(item => item.status === 'Blocked').length}<small>Access needed</small></strong></div>
      <div class="demo-metric metric-risk"><span class="metric-label">At risk</span><strong>${sampleWork.filter(item => item.status === 'At Risk').length}<small>Manual escalation noted</small></strong></div>
      <div class="demo-metric metric-owner"><span class="metric-label">Missing owner</span><strong>${sampleWork.filter(item => item.owner === 'Unassigned').length}<small>Decision waiting</small></strong></div>
    </section>
    <section class="work-section" aria-labelledby="work-heading"><div class="work-section-heading"><h2 id="work-heading">${name === 'attention' ? 'Work to review' : name === 'projects' ? 'Project workload' : 'The working view'}</h2><span id="result-count" role="status" aria-live="polite"></span></div>
      <button type="button" class="mobile-filter-toggle" aria-expanded="false" aria-controls="filter-panel">Filters</button>
      <form id="filter-panel" class="demo-filters" role="search" aria-label="Filter sample work">
        <label class="search-field"><span class="small-label">Search</span><input id="search-work" name="q" type="search" placeholder="Find sample work…" aria-label="Search sample work" autocomplete="off"></label>
        <label><span class="small-label">Group</span><select name="group" aria-label="Filter by group">${options(sampleWork.map(item => item.group), 'All groups')}</select></label>
        <label><span class="small-label">Type</span><select name="type" aria-label="Filter by type">${options(sampleWork.map(item => item.type), 'All types')}</select></label>
        <label><span class="small-label">Owner</span><select name="owner" aria-label="Filter by owner">${options(sampleWork.map(item => item.owner), 'All owners')}</select></label>
        <button class="clear-filters" type="reset">Clear filters</button>
      </form>
      <div class="work-columns" aria-hidden="true"><span>Work & context</span><span>Owner & status</span><span>The next move</span></div>
      <div id="work-results"></div>
    </section>`;
  const form = view.querySelector('form');
  const filterToggle = view.querySelector('.mobile-filter-toggle');
  filterToggle.addEventListener('click', () => {
    const open = form.classList.toggle('filters-open');
    filterToggle.setAttribute('aria-expanded', String(open));
  });
  for (const field of ['q', 'group', 'type', 'owner']) {
    const control = form.elements.namedItem(field);
    const value = params.get(field) || '';
    if (field === 'q' || [...control.options].some(option => option.value === value)) control.value = value;
  }
  function filterWork(updateUrl = true) {
    const values = Object.fromEntries(new FormData(form));
    const activeFilters = Object.values(values).filter(Boolean).length;
    filterToggle.textContent = activeFilters ? `Filters · ${activeFilters} active` : 'Filters';
    const query = values.q.toLowerCase().trim();
    const filtered = config.items.filter(item => (!values.group || item.group === values.group) && (!values.type || item.type === values.type) && (!values.owner || item.owner === values.owner) && (!query || [item.title, item.group, item.owner, item.status, item.issue, item.next].some(value => value.toLowerCase().includes(query))));
    document.getElementById('result-count').textContent = `${filtered.length} of ${config.items.length} ${name === 'projects' ? 'projects' : 'work items'}`;
    document.getElementById('work-results').innerHTML = filtered.length ? filtered.map(card).join('') : '<div class="empty-state"><h3>No matching sample work</h3><p>Try another owner, group, or search. Clear filters to see this view again.</p></div>';
    if (updateUrl) {
      const next = new URLSearchParams();
      Object.entries(values).forEach(([key, value]) => { if (value) next.set(key, value); });
      history.replaceState(null, '', `#${name}${next.size ? `?${next}` : ''}`);
    }
    returnRoute = location.hash || '#overview';
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => filterWork());
  form.addEventListener('reset', event => { event.preventDefault(); [...form.elements].forEach(control => { if ('value' in control && control.name) control.value = ''; }); filterWork(); });
  filterWork(false);
}

function renderDetail(item) {
  selectedView(currentList);
  document.title = `${item.title} · Mission-Board demo`;
  const project = item.type === 'Project';
  const related = sampleWork.find(work => work.id === item.related);
  view.innerHTML = `<a href="${escape(returnRoute)}" class="demo-back">← Back to ${escape(views[currentList].title)}</a>
    <div class="demo-page-heading detail-heading"><div><p class="eyebrow">${escape(item.type)} ${escape(item.code)} / ${escape(item.group)}</p><h1 tabindex="-1">${escape(item.title)}</h1><p class="page-description">${escape(item.summary)}</p></div>${badge(item)}</div>
    <div class="detail-context"><span>${person(item)}</span><span>${project ? 'Project target' : 'Task due'}: <strong>${escape(item.target || item.due)}</strong></span><span class="read-only-label">Read-only sample</span></div>
    <div class="detail-layout"><div class="detail-primary">
      <section class="detail-panel" aria-labelledby="status-heading"><div class="panel-heading"><span class="small-label">${project ? 'Manager review' : 'Task review'}</span><h2 id="status-heading">${project ? 'Project status' : 'Task status'}</h2></div>
        <div class="status-snapshot"><div class="snapshot-cell ${escape(item.tone)}"><span class="small-label">${project ? 'Current status' : 'Attention reason'}</span><strong>${escape(project ? item.status : item.reason)}</strong><p>${escape(project ? item.reason : item.status)}</p></div><div class="snapshot-cell"><span class="small-label">${project ? 'Next action owner' : 'Assigned to'}</span><strong>${escape(item.nextOwner)}</strong><p>Due ${escape(item.due)}</p></div></div>
        <div class="next-action-box"><span class="small-label">${project ? 'Next step' : 'Next step · From task notes'}</span><h3>${escape(item.next)}</h3></div>
        <div class="issue-note ${escape(item.tone)}"><strong>${item.status === 'Blocked' ? 'Blocked because' : item.escalated ? 'Escalation context' : project ? 'Current context' : 'Decision needed'}</strong><p>${escape(item.issue)}</p></div>
        <div class="last-update">Last sample update <strong>${escape(item.updated)}</strong></div>
      </section>
      ${project ? `<section class="detail-panel" aria-labelledby="actions-heading"><div class="panel-heading row-heading"><h2 id="actions-heading">Action items</h2><span>${item.actions.filter(action => action.status === 'Completed').length} of ${item.actions.length} completed</span></div><ul class="action-list">${item.actions.map(action => `<li><span class="action-check ${action.status === 'Completed' ? 'complete' : ''}" aria-hidden="true">${action.status === 'Completed' ? '✓' : '○'}</span><div>${action.related ? `<a href="${itemLink(action.related)}">${escape(action.title)}</a>` : `<strong>${escape(action.title)}</strong>`}<small>${escape(action.owner)}</small></div><span class="action-status">${escape(action.status)}</span></li>`).join('')}</ul></section>` : `<section class="detail-panel notes-panel"><div class="panel-heading"><h2>Task notes</h2></div><p>${escape(item.notes)}</p><dl><div><dt>Priority</dt><dd>${escape(item.priority)}</dd></div><div><dt>Related project</dt><dd><a href="${itemLink(related.id)}">${escape(related.title)}</a></dd></div></dl></section>`}
    </div><aside class="detail-secondary">${project ? `<section class="detail-panel updates-panel" aria-labelledby="updates-heading"><div class="panel-heading"><span class="small-label">Fictional activity</span><h2 id="updates-heading">Project updates</h2></div><ol class="update-list">${item.updates.map(update => `<li><span class="timeline-dot" aria-hidden="true"></span><span class="update-date">${escape(update.date)}</span><strong>${escape(update.person)}</strong><p>${escape(update.text)}</p></li>`).join('')}</ol></section>` : ''}
    <div class="demo-caption"><span class="small-label">What this shows</span><p>${item.escalated ? 'People record escalations in updates and name the next action owner. Mission-Board keeps that context with the work.' : item.owner === 'Unassigned' ? 'A waiting task can still have no owner. Needs Attention makes that missing responsibility visible.' : item.status === 'Blocked' ? 'The blocker, next action, owner, and due date sit together, so the next follow-up is clear.' : 'Current status and completed action items show progress, while the next action names who moves it forward.'}</p></div></aside></div>`;
}

function route(focus = true) {
  if (location.hash === '#main') {
    renderList('overview', new URLSearchParams());
    returnRoute = '#overview';
    main.focus();
    return;
  }
  const raw = location.hash.slice(1) || 'overview';
  const divider = raw.indexOf('?');
  const name = divider < 0 ? raw : raw.slice(0, divider);
  const params = new URLSearchParams(divider < 0 ? '' : raw.slice(divider + 1));
  if (Object.hasOwn(views, name)) renderList(name, params);
  else {
    const item = sampleWork.find(work => `work/${work.id}` === name);
    if (item) renderDetail(item);
    else {
      selectedView('');
      document.title = 'Sample not found · Mission-Board demo';
      view.innerHTML = '<section class="empty-state not-found"><h1 tabindex="-1">Sample work not found</h1><p>This demo contains four fictional work items.</p><a class="btn btn-primary" href="#overview">Return to overview</a></section>';
    }
  }
  if (focus) { view.querySelector('h1')?.focus({ preventScroll: true }); window.scrollTo(0, 0); }
}

document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); main.scrollIntoView(); });
window.addEventListener('hashchange', () => route());
route(false);
