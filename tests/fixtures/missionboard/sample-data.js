// Authored fictional fixtures. Never generated from an application database.
// Dates deliberately stay anchored to the labeled sample snapshot.
const work = [
  {
    id: 'service-desk-move', type: 'Project', title: 'Service desk move', code: 'CW-102',
    group: 'Workplace Services', owner: 'Theo Park', initials: 'TP', status: 'Blocked', tone: 'blocked',
    attention: true, scenario: 'A blocker with a clear owner', reason: 'Waiting on access',
    summary: 'Move the support desk into the new workshop before the next intake day.',
    issue: 'Room access is still pending. Equipment installation cannot start.',
    next: 'Confirm room access with the facilities lead.', nextOwner: 'Theo Park', due: 'Oct 15, 2026', target: 'Oct 21, 2026',
    updated: 'Oct 14 · 9:40 AM',
    actions: [
      { title: 'Inventory desk equipment', owner: 'Theo Park', status: 'Completed' },
      { title: 'Obtain access to the new room', owner: 'Theo Park', status: 'Blocked' },
      { title: 'Install and test the support desk', owner: 'Mara Vale', status: 'Not Started' }
    ],
    updates: [
      { date: 'Oct 14 · 9:40 AM', person: 'Theo Park', text: 'Project marked Blocked. The room access request is still pending; installation cannot begin. I will confirm access with the facilities lead by Oct 15.' },
      { date: 'Oct 13 · 2:15 PM', person: 'Theo Park', text: 'Equipment inventory completed. The installation checklist is ready for the move.' }
    ]
  },
  {
    id: 'dispatch-recovery', type: 'Project', title: 'Dispatch tablet recovery', code: 'CW-103',
    group: 'Field Operations', owner: 'Nia Quinn', initials: 'NQ', status: 'At Risk', tone: 'risk',
    attention: true, scenario: 'Escalation recorded in an update', reason: 'Technical risk', escalated: true,
    summary: 'Restore reliable job synchronization on the workshop’s dispatch tablets.',
    issue: 'Pilot tablets lose queued jobs. Nia has escalated the recovery plan to the operations lead.',
    next: 'Review the recovery plan with the operations lead.', nextOwner: 'Nia Quinn', due: 'Oct 14, 2026', target: 'Oct 19, 2026',
    updated: 'Oct 14 · 10:10 AM',
    actions: [
      { title: 'Reproduce the synchronization issue', owner: 'Nia Quinn', status: 'Completed' },
      { title: 'Validate the recovery procedure', owner: 'Nia Quinn', status: 'In Progress' },
      { title: 'Confirm the recovery plan', owner: 'Theo Park', status: 'Waiting On' }
    ],
    updates: [
      { date: 'Oct 14 · 10:10 AM', person: 'Nia Quinn', text: 'Escalated to the operations lead after the retry test failed. Shared the project link and requested a recovery-plan review today. I own the follow-up; the pilot stays paused.' },
      { date: 'Oct 13 · 3:30 PM', person: 'Nia Quinn', text: 'Reproduced missing queued jobs on two sample tablets. A manual dispatch process is available while we validate recovery.' }
    ]
  },
  {
    id: 'pilot-window', type: 'Action Item', title: 'Choose the pilot handoff window', code: 'CW-T14',
    group: 'Field Operations', owner: 'Unassigned', initials: '?', status: 'Waiting On', tone: 'waiting',
    attention: true, scenario: 'A decision awaiting an owner', reason: 'Missing owner',
    summary: 'Choose a morning or afternoon handoff for the field kit pilot and name the person who will coordinate it.',
    issue: 'Both windows are available. No one owns the scheduling decision yet.',
    next: 'Name a decision owner, then confirm a handoff window.', nextOwner: 'Unassigned', due: 'Oct 16, 2026',
    updated: 'Oct 14 · 8:50 AM', related: 'field-kit-rollout', priority: 'High',
    notes: 'Morning gives the team more time for checks; afternoon avoids the dispatch peak. Ask the operations lead to name a decision owner before Oct 16. The field kits can continue being prepared while this is decided.'
  },
  {
    id: 'field-kit-rollout', type: 'Project', title: 'Field kit rollout', code: 'CW-101',
    group: 'Field Operations', owner: 'Mara Vale', initials: 'MV', status: 'On Track', tone: 'good',
    attention: false, scenario: 'Work progressing normally', reason: 'No issue listed',
    summary: 'Prepare and pilot a standard equipment kit for the Cedarfield field team.',
    issue: 'The pilot kits passed their checks. Preparation is moving as planned.',
    next: 'Pack the six pilot kits and complete the handoff checklist.', nextOwner: 'Mara Vale', due: 'Oct 15, 2026', target: 'Oct 23, 2026',
    updated: 'Oct 14 · 9:05 AM',
    actions: [
      { title: 'Confirm the equipment list', owner: 'Mara Vale', status: 'Completed' },
      { title: 'Check the pilot kits', owner: 'Nia Quinn', status: 'Completed' },
      { title: 'Pack six pilot kits', owner: 'Mara Vale', status: 'In Progress' },
      { title: 'Choose the pilot handoff window', owner: 'Unassigned', status: 'Waiting On', related: 'pilot-window' }
    ],
    updates: [
      { date: 'Oct 14 · 9:05 AM', person: 'Mara Vale', text: 'All six pilot kits passed their equipment checks. Packing is next. The handoff window is tracked as a separate task, due Oct 16.' },
      { date: 'Oct 13 · 11:20 AM', person: 'Nia Quinn', text: 'Completed equipment checks and recorded the kit checklist. No hardware issues found in the sample pilot.' }
    ]
  }
];

function freeze(value) {
  Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child); });
  return Object.freeze(value);
}

export const sampleWork = freeze(work);
