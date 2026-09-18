/* ==========================================================
   BetGuard AI — Review Console
   All data below is invented/fictional for demonstration only.
   ========================================================== */

const DEPOSIT_LABELS = ['None', 'Mild', 'Moderate', 'Severe'];
const DEPOSIT_POINTS = [0, 10, 20, 30];

function computeScore(device, claims, depositLevel) {
  const raw = device * 6 + claims * 2 + DEPOSIT_POINTS[depositLevel];
  return Math.min(100, Math.round(raw));
}

function tierOf(score) {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  return 'high';
}

function tierLabel(tier) {
  return { low: 'Low', medium: 'Moderate', high: 'High' }[tier];
}

/* ---- Fictional case seed data ---- */
const RAW_CASES = [
  { id: 'ACC-10234', name: 'Fictional Account 10234', device: 1, claims: 1, depositLevel: 0, status: 'Cleared', date: '2026-09-02', reason: 'Routine automated scan' },
  { id: 'ACC-58210', name: 'Fictional Account 58210', device: 0, claims: 3, depositLevel: 1, status: 'Cleared', date: '2026-09-03', reason: 'Mild deposit variance' },
  { id: 'ACC-77719', name: 'Fictional Account 77719', device: 2, claims: 4, depositLevel: 1, status: 'In Review', date: '2026-09-05', reason: 'Two accounts sharing a device' },
  { id: 'ACC-40021', name: 'Fictional Account 40021', device: 3, claims: 5, depositLevel: 1, status: 'New', date: '2026-09-06', reason: 'Rising bonus claim frequency' },
  { id: 'ACC-90911', name: 'Fictional Account 90911', device: 1, claims: 10, depositLevel: 2, status: 'In Review', date: '2026-09-07', reason: 'High bonus claim volume' },
  { id: 'ACC-11020', name: 'Fictional Account 11020', device: 4, claims: 6, depositLevel: 2, status: 'New', date: '2026-09-08', reason: 'Moderate deposit anomaly + shared device' },
  { id: 'ACC-88213', name: 'Fictional Account 88213', device: 5, claims: 8, depositLevel: 2, status: 'Escalated', date: '2026-09-09', reason: 'Multiple accounts on one device' },
  { id: 'ACC-30044', name: 'Fictional Account 30044', device: 6, claims: 9, depositLevel: 3, status: 'New', date: '2026-09-10', reason: 'Severe deposit pattern break' },
  { id: 'ACC-99123', name: 'Fictional Account 99123', device: 8, claims: 12, depositLevel: 3, status: 'Escalated', date: '2026-09-11', reason: 'All three signals elevated' },
  { id: 'ACC-20567', name: 'Fictional Account 20567', device: 0, claims: 0, depositLevel: 0, status: 'Cleared', date: '2026-09-01', reason: 'No signals triggered' },
  { id: 'ACC-64821', name: 'Fictional Account 64821', device: 2, claims: 2, depositLevel: 0, status: 'Cleared', date: '2026-09-04', reason: 'Minor device overlap' },
  { id: 'ACC-40912', name: 'Fictional Account 40912', device: 3, claims: 7, depositLevel: 2, status: 'In Review', date: '2026-09-12', reason: 'Bonus claims trending up' },
  { id: 'ACC-70233', name: 'Fictional Account 70233', device: 7, claims: 10, depositLevel: 3, status: 'Escalated', date: '2026-09-13', reason: 'Syndicate-pattern device sharing' },
  { id: 'ACC-15678', name: 'Fictional Account 15678', device: 1, claims: 4, depositLevel: 1, status: 'New', date: '2026-09-14', reason: 'Mild bonus claim uptick' },
];

const CASES = RAW_CASES.map((c) => ({
  ...c,
  score: computeScore(c.device, c.claims, c.depositLevel),
  tier: tierOf(computeScore(c.device, c.claims, c.depositLevel)),
  notes: [],
}));

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
        <div class="case-id">${c.id}</div>
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

  content.innerHTML = `
    <button class="detail-close" id="detail-close-btn" aria-label="Close">✕</button>
    <div class="detail-title serif">${c.id}</div>
    <div class="detail-sub">Flagged ${c.date} — ${c.reason}</div>

    <div class="detail-score-row">
      <div class="detail-score-num" style="color: var(--${c.tier === 'high' ? 'coral' : c.tier === 'medium' ? 'amber' : 'teal'})">${c.score}</div>
      <div>
        <span class="pill ${c.tier}">${tierLabel(c.tier)} risk</span>
        <div style="font-size:11.5px;color:var(--text-dim);margin-top:6px;">out of 100</div>
      </div>
    </div>

    <div class="detail-block">
      <h3>Signal breakdown</h3>
      <div class="signal-row"><span>Shared device accounts</span><span>${c.device}</span></div>
      <div class="signal-row"><span>Bonus claims</span><span>${c.claims}</span></div>
      <div class="signal-row"><span>Deposit pattern</span><span>${DEPOSIT_LABELS[c.depositLevel]}</span></div>
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
