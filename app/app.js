/* ==========================================================
   BetGuard AI — Review Console
   All data below is invented/fictional for demonstration only.

   Signals:
     1. Shared device accounts (count)
     2. Bonus claims (count)
     3. Deposit pattern (0-3 severity)
     4. Linked accounts (NEW) — computed by cross-referencing
        which fictional cases share the same deviceId, so an
        account that looks unremarkable on its own can still be
        flagged for being part of a larger cluster. This is a
        simple, explainable version of the graph-based / network
        detection approach used to catch coordinated rings.
   ========================================================== */

const DEPOSIT_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const DEPOSIT_POINTS = [0, 10, 20, 30];

function computeBaseScore(device, claims, depositLevel) {
  const raw = device * 6 + claims * 2 + DEPOSIT_POINTS[depositLevel];
  return Math.min(100, Math.round(raw));
}

/* ---- Linked accounts: group cases by shared deviceId ---- */
function buildLinkedGroups(cases) {
  const byDevice = {};
  cases.forEach((c) => {
    if (!c.deviceId) return;
    (byDevice[c.deviceId] = byDevice[c.deviceId] || []).push(c.id);
  });
  const groups = {};
  Object.keys(byDevice).forEach((deviceId) => {
    if (byDevice[deviceId].length > 1) groups[deviceId] = byDevice[deviceId];
  });
  return groups;
}

function linkBonusFor(caseId, groups) {
  let others = 0;
  let groupIds = [];
  Object.values(groups).forEach((ids) => {
    if (ids.includes(caseId)) {
      others = Math.max(others, ids.length - 1);
      groupIds = ids.filter((id) => id !== caseId);
    }
  });
  if (others <= 0) return { bonus: 0, note: 'Not linked to any other account.', linked: [] };
  if (others === 1) return { bonus: 10, note: 'Shares a device with 1 other account.', linked: groupIds };
  return { bonus: 20, note: `Shares a device with ${others} other accounts — part of a larger cluster.`, linked: groupIds };
}

function tierOf(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  return 'high';
}

function tierLabel(tier) {
  return { low: 'Low', medium: 'Moderate', high: 'High' }[tier];
}

/* ---- Fictional case seed data ----
   deviceId: 'dev-alpha' links ACC-77719 and ACC-11020 (a pair).
   deviceId: 'dev-syndicate' links ACC-88213, ACC-70233 and
   ACC-99123 (a three-account cluster) — the same cases whose
   reasons already hinted at coordinated device sharing.
   Every other case has its own unique deviceId, so it is not
   linked to anyone. */
const RAW_CASES = [
  { id: 'ACC-10234', name: 'Fictional Account 10234', device: 1, claims: 1, depositLevel: 0, deviceId: 'dev-10234', status: 'Cleared', date: '2026-09-02', reason: 'Routine automated scan' },
  { id: 'ACC-58210', name: 'Fictional Account 58210', device: 0, claims: 3, depositLevel: 1, deviceId: 'dev-58210', status: 'Cleared', date: '2026-09-03', reason: 'Mild deposit variance' },
  { id: 'ACC-77719', name: 'Fictional Account 77719', device: 2, claims: 4, depositLevel: 1, deviceId: 'dev-alpha', status: 'In Review', date: '2026-09-05', reason: 'Two accounts sharing a device' },
  { id: 'ACC-40021', name: 'Fictional Account 40021', device: 3, claims: 5, depositLevel: 1, deviceId: 'dev-40021', status: 'New', date: '2026-09-06', reason: 'Rising bonus claim frequency' },
  { id: 'ACC-90911', name: 'Fictional Account 90911', device: 1, claims: 10, depositLevel: 2, deviceId: 'dev-90911', status: 'In Review', date: '2026-09-07', reason: 'High bonus claim volume' },
  { id: 'ACC-11020', name: 'Fictional Account 11020', device: 4, claims: 6, depositLevel: 2, deviceId: 'dev-alpha', status: 'New', date: '2026-09-08', reason: 'Moderate deposit anomaly + shared device' },
  { id: 'ACC-88213', name: 'Fictional Account 88213', device: 5, claims: 8, depositLevel: 2, deviceId: 'dev-syndicate', status: 'Escalated', date: '2026-09-09', reason: 'Multiple accounts on one device' },
  { id: 'ACC-30044', name: 'Fictional Account 30044', device: 6, claims: 9, depositLevel: 3, deviceId: 'dev-30044', status: 'New', date: '2026-09-10', reason: 'Severe deposit pattern break' },
  { id: 'ACC-99123', name: 'Fictional Account 99123', device: 8, claims: 12, depositLevel: 3, deviceId: 'dev-syndicate', status: 'Escalated', date: '2026-09-11', reason: 'All three signals elevated' },
  { id: 'ACC-20567', name: 'Fictional Account 20567', device: 0, claims: 0, depositLevel: 0, deviceId: 'dev-20567', status: 'Cleared', date: '2026-09-01', reason: 'No signals triggered' },
  { id: 'ACC-64821', name: 'Fictional Account 64821', device: 2, claims: 2, depositLevel: 0, deviceId: 'dev-64821', status: 'Cleared', date: '2026-09-04', reason: 'Minor device overlap' },
  { id: 'ACC-40912', name: 'Fictional Account 40912', device: 3, claims: 7, depositLevel: 2, deviceId: 'dev-40912', status: 'In Review', date: '2026-09-12', reason: 'Bonus claims trending up' },
  { id: 'ACC-70233', name: 'Fictional Account 70233', device: 7, claims: 10, depositLevel: 3, deviceId: 'dev-syndicate', status: 'Escalated', date: '2026-09-13', reason: 'Syndicate-pattern device sharing' },
  { id: 'ACC-15678', name: 'Fictional Account 15678', device: 1, claims: 4, depositLevel: 1, deviceId: 'dev-15678', status: 'New', date: '2026-09-14', reason: 'Mild bonus claim uptick' },
];

const LINKED_GROUPS = buildLinkedGroups(RAW_CASES);

const CASES = RAW_CASES.map((c) => {
  const baseScore = computeBaseScore(c.device, c.claims, c.depositLevel);
  const link = linkBonusFor(c.id, LINKED_GROUPS);
  const totalScore = Math.min(100, baseScore + link.bonus);
  return {
    ...c,
    baseScore,
    linkBonus: link.bonus,
    linkNote: link.note,
    linkedIds: link.linked,
    score: totalScore,
    tier: tierOf(totalScore),
    notes: [],
  };
});

/* ---- Persisted state (notes + status edits), best-effort ---- */
const STORAGE_KEY = 'betguard_case_overrides_v1';

function loadOverrides() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function saveOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    /* storage unavailable — continue without persistence */
  }
}

const overrides = loadOverrides();
CASES.forEach((c) => {
  const o = overrides[c.id];
  if (o) {
    if (o.status) c.status = o.status;
    if (o.notes) c.notes = o.notes;
  }
});

function persistCase(c) {
  overrides[c.id] = { status: c.status, notes: c.notes };
  saveOverrides(overrides);
}

/* ---- App state ---- */
let state = {
  search: '',
  tier: 'all',
  status: 'all',
  selectedId: null,
};

/* ---- Rendering ---- */
function renderStats() {
  const total = CASES.length;
  const high = CASES.filter((c) => c.tier === 'high').length;
  const medium = CASES.filter((c) => c.tier === 'medium').length;
  const low = CASES.filter((c) => c.tier === 'low').length;
  const linked = CASES.filter((c) => c.linkedIds.length > 0).length;

  const grid = document.getElementById('stats-grid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total cases</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">High risk</div>
      <div class="stat-value high">${high}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Moderate risk</div>
      <div class="stat-value medium">${medium}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Low risk</div>
      <div class="stat-value low">${low}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">In a linked cluster</div>
      <div class="stat-value">${linked}</div>
    </div>
  `;
}

function statusClass(status) {
  return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
}

function getFilteredCases() {
  const q = state.search.trim().toLowerCase();
  return CASES.filter((c) => {
    if (state.tier !== 'all' && c.tier !== state.tier) return false;
    if (state.status !== 'all' && c.status !== state.status) return false;
    if (q && !(c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))) return false;
    return true;
  }).sort((a, b) => b.score - a.score);
}

function renderQueue() {
  const list = document.getElementById('queue-list');
  const emptyState = document.getElementById('empty-state');
  const filtered = getFilteredCases();

  if (filtered.length === 0) {
    list.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  list.innerHTML = filtered.map((c) => `
    <button class="case-row" role="listitem" data-id="${c.id}">
      <div>
        <div class="case-id">${c.id}${c.linkedIds.length ? ' <span class="link-tag" title="Linked to other accounts">🔗</span>' : ''}</div>
        <div class="case-reason">${c.reason}</div>
      </div>
      <div><span class="col-label">Score</span><span class="score-num">${c.score}</span></div>
      <div><span class="col-label">Tier</span><span class="pill ${c.tier}">${tierLabel(c.tier)}</span></div>
      <div><span class="col-label">Status</span><span class="status-pill ${statusClass(c.status)}">${c.status}</span></div>
      <div class="case-date"><span class="col-label">Flagged</span>${c.date}</div>
    </button>
  `).join('');

  list.querySelectorAll('.case-row').forEach((row) => {
    row.addEventListener('click', () => openDetail(row.getAttribute('data-id')));
  });
}

function renderDetail() {
  const panel = document.getElementById('detail-panel');
  const overlay = document.getElementById('detail-overlay');
  const content = document.getElementById('detail-content');

  if (!state.selectedId) {
    panel.classList.add('hidden');
    overlay.classList.add('hidden');
    return;
  }

  const c = CASES.find((x) => x.id === state.selectedId);
  if (!c) return;

  panel.classList.remove('hidden');
  overlay.classList.remove('hidden');

  const linkedListHtml = c.linkedIds.length
    ? `<div class="linked-ids">${c.linkedIds.map((id) => `<button class="linked-chip" data-goto="${id}">${id}</button>`).join('')}</div>`
    : '';

  content.innerHTML = `
    <button class="detail-close" id="detail-close-btn" aria-label="Close">✕</button>
    <div class="detail-title serif">${c.id}</div>
    <div class="detail-sub">Flagged ${c.date} — ${c.reason}</div>

    <div class="detail-score-row">
      <div class="detail-score-num" style="color: var(--${c.tier === 'high' ? 'coral' : c.tier === 'medium' ? 'amber' : 'teal'})">${c.score}</div>
      <div>
        <span class="pill ${c.tier}">${tierLabel(c.tier)} risk</span>
        <div style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">out of 100 (${c.baseScore} base + ${c.linkBonus} linked)</div>
      </div>
    </div>

    <div class="detail-block">
      <h3>Signal breakdown</h3>
      <div class="signal-row"><span>Shared device accounts</span><span>${c.device}</span></div>
      <div class="signal-row"><span>Bonus claims</span><span>${c.claims}</span></div>
      <div class="signal-row"><span>Deposit pattern</span><span>${DEPOSIT_LABELS[c.depositLevel]}</span></div>
      <div class="signal-row"><span>Linked accounts</span><span>+${c.linkBonus}</span></div>
      <div class="signal-note">${c.linkNote}</div>
      ${linkedListHtml}
    </div>

    <div class="detail-block">
      <h3>Case status</h3>
      <select class="status-select" id="status-select">
        ${['New', 'In Review', 'Escalated', 'Cleared'].map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>

    <div class="detail-block">
      <h3>Reviewer notes</h3>
      <div class="notes-list" id="notes-list">
        ${c.notes.length === 0
          ? '<div class="note-empty">No notes yet.</div>'
          : c.notes.map((n) => `<div class="note-item">${escapeHtml(n.text)}<div class="note-meta">${n.timestamp}</div></div>`).join('')
        }
      </div>
      <div class="note-form">
        <textarea id="note-input" placeholder="Add a reviewer note…"></textarea>
        <button class="btn" id="add-note-btn">Add note</button>
      </div>
    </div>
  `;

  document.getElementById('detail-close-btn').addEventListener('click', closeDetail);

  content.querySelectorAll('.linked-chip').forEach((chip) => {
    chip.addEventListener('click', () => openDetail(chip.getAttribute('data-goto')));
  });

  document.getElementById('status-select').addEventListener('change', (e) => {
    c.status = e.target.value;
    persistCase(c);
    renderStats();
    renderQueue();
  });

  document.getElementById('add-note-btn').addEventListener('click', () => {
    const input = document.getElementById('note-input');
    const text = input.value.trim();
    if (!text) return;
    c.notes.push({ text, timestamp: new Date().toLocaleString() });
    persistCase(c);
    renderDetail();
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openDetail(id) {
  state.selectedId = id;
  renderDetail();
}
function closeDetail() {
  state.selectedId = null;
  renderDetail();
}

/* ---- Wire up controls ---- */
document.getElementById('search-input').addEventListener('input', (e) => {
  state.search = e.target.value;
  renderQueue();
});
document.getElementById('tier-filter').addEventListener('change', (e) => {
  state.tier = e.target.value;
  renderQueue();
});
document.getElementById('status-filter').addEventListener('change', (e) => {
  state.status = e.target.value;
  renderQueue();
});
document.getElementById('detail-overlay').addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetail();
});

/* ---- Init ---- */
renderStats();
renderQueue();
renderDetail();
       
