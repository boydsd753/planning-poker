'use strict';

const DECKS = {
  fibonacci:  ['0', '½', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  modified:   ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'],
  tshirt:     ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
  powers2:    ['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕'],
  sequential: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕'],
};

const $ = id => document.getElementById(id);

// Heroicons SVGs
const ICON_STAR     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="11" height="11" style="vertical-align:-1px"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd"/></svg>`;
const ICON_EYE      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14" style="vertical-align:-2px"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>`;
const ICON_BREAK    = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9v6m-4.5 0V9M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;
const ICON_SPARKLES = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16" style="vertical-align:-3px"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/></svg>`;
const ICON_USER     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;

function cardDisplay(val) {
  if (val === '☕') return ICON_BREAK;
  if (val === '__ai__') return ICON_SPARKLES;
  return escHtml(val);
}

// ── Custom dropdowns & segmented controls ────────────────────────────────
const ICON_CHECK      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`;
const ICON_PAPERCLIP  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13" style="vertical-align:-2px"><path stroke-linecap="round" stroke-linejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/></svg>`;
const ICON_PERSON     = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13" style="vertical-align:-2px"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`;

function initCustomSelect(cs) {
  const nativeSel = document.getElementById(cs.dataset.for);
  if (!nativeSel) return;
  const trigger  = cs.querySelector('.csel-trigger');
  const valueEl  = cs.querySelector('.csel-value');
  const dropdown = cs.querySelector('.csel-dropdown');

  function render() {
    dropdown.innerHTML = '';
    Array.from(nativeSel.options).forEach(opt => {
      const li = document.createElement('li');
      li.className = 'csel-option' + (opt.value === nativeSel.value ? ' selected' : '');
      li.dataset.value = opt.value;
      li.innerHTML = `
        <div class="csel-opt-content">
          <span class="csel-opt-label">${opt.dataset.label || opt.text}</span>
          ${opt.dataset.sub ? `<span class="csel-opt-sub">${opt.dataset.sub}</span>` : ''}
        </div>
        <span class="csel-check">${ICON_CHECK}</span>`;
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        nativeSel.value = opt.value;
        nativeSel.dispatchEvent(new Event('change'));
        valueEl.textContent = opt.dataset.label || opt.text;
        dropdown.querySelectorAll('.csel-option').forEach(o =>
          o.classList.toggle('selected', o.dataset.value === opt.value));
        closeDropdown();
        // Show/hide custom deck input
        if (nativeSel.id === 'sel-deck') {
          const wrap = document.getElementById('custom-deck-wrap');
          if (wrap) wrap.classList.toggle('hidden', opt.value !== 'custom');
        }
      });
      dropdown.appendChild(li);
    });
    const sel = nativeSel.options[nativeSel.selectedIndex];
    if (sel) valueEl.textContent = sel.dataset.label || sel.text;
  }

  function openDropdown() { render(); dropdown.classList.remove('hidden'); trigger.classList.add('open'); }
  function closeDropdown() { dropdown.classList.add('hidden'); trigger.classList.remove('open'); }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.contains('hidden') ? openDropdown() : closeDropdown();
  });
  render();
}

function initSegControl(sc) {
  const nativeSel = document.getElementById(sc.dataset.for);
  if (!nativeSel) return;
  sc.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sc.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      nativeSel.value = btn.dataset.value;
    });
  });
}

document.querySelectorAll('.custom-select').forEach(initCustomSelect);
document.querySelectorAll('.seg-control').forEach(initSegControl);

document.addEventListener('click', () => {
  document.querySelectorAll('.csel-dropdown:not(.hidden)').forEach(d => {
    d.classList.add('hidden');
    d.closest('.custom-select')?.querySelector('.csel-trigger')?.classList.remove('open');
  });
});

// ── Avatar picker ────────────────────────────────────────────────────────────
let myAvatar = null; // base64 JPEG string or null

(function initAvatarPicker() {
  const preview   = $('avatar-preview');
  const img       = $('avatar-preview-img');
  const label     = $('avatar-pick-label');
  const fileInput = $('inp-avatar');
  if (!preview || !fileInput) return;

  preview.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const srcImg = new Image();
      srcImg.onload = () => {
        const SIZE = 64;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        // Crop to square from center
        const s = Math.min(srcImg.width, srcImg.height);
        const ox = (srcImg.width  - s) / 2;
        const oy = (srcImg.height - s) / 2;
        ctx.drawImage(srcImg, ox, oy, s, s, 0, 0, SIZE, SIZE);
        myAvatar = canvas.toDataURL('image/jpeg', 0.82);
        img.src = myAvatar;
        img.classList.remove('hidden');
        preview.classList.add('has-image');
        if (label) label.textContent = 'Change';
      };
      srcImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    fileInput.value = ''; // allow re-selecting same file
  });
})();

// DOM
const screenLanding    = $('screen-landing');
const screenGame       = $('screen-game');
const inpName          = $('inp-name');
const inpRoomCode      = $('inp-room-code');
const inpGameName      = $('inp-game-name');
const selDeck          = $('sel-deck');
const selWhoReveal     = $('sel-who-reveal');
const selRole          = $('sel-role');
const togAutoReveal    = $('tog-auto-reveal');
const togShowAvg       = $('tog-show-avg');
const togCountdown     = $('tog-countdown');
const togSpectator     = $('tog-spectator');
const btnCreate        = $('btn-create');
const btnJoin          = $('btn-join');
const btnCopyLink      = $('btn-copy-link');
const btnLeave         = $('btn-leave');
const btnTransferHost  = $('btn-transfer-host');
const btnLinkJira      = $('btn-link-jira');
const btnLinkJiraMobile = $('btn-link-jira-mobile');
const transferModal    = $('transfer-modal');
const transferList     = $('transfer-player-list');
const btnTransferCancel = $('btn-transfer-cancel');
const btnReveal        = $('btn-reveal');
const btnNewRound      = $('btn-new-round');
const chkToggleDealers = $('chk-toggle-dealers');
const btnIssuesToggle  = $('btn-issues-toggle');
const btnSidebarClose  = $('btn-sidebar-close');
const btnTimerStart    = $('btn-timer-start');
const btnTimerPause    = $('btn-timer-pause');
const btnTimerReset    = $('btn-timer-reset');
const btnAddIssue      = $('btn-add-issue');
const inpIssue         = $('inp-issue');
const roomCodeDisplay  = $('room-code-display');
const gameNameDisplay  = $('game-name-display');
const devCenterEl      = $('dev-center-content');
const qaCenterEl       = $('qa-center-content');
const devPlayersLayer  = $('dev-players-layer');
const qaPlayersLayer   = $('qa-players-layer');
const spectatorsLayer  = $('spectators-layer');
const devArea          = $('dev-area');
const qaArea           = $('qa-area');
const devPokerTable    = $('dev-poker-table');
const qaPokerTable     = $('qa-poker-table');
const cardsRow         = $('cards-row');
const landingError     = $('landing-error');
const voteTally        = $('vote-tally');
const countdownOverlay = $('countdown-overlay');
const countdownNumber  = $('countdown-number');
const issuesSidebar    = $('issues-sidebar');
const issueList        = $('issue-list');
const timerDisplay     = $('timer-display');
const pickerPanel      = $('picker-panel');
const resultsPanel     = $('results-panel');
const resultsContent   = $('results-content');
const toastsEl         = $('toasts');

// State
let myId        = null;
let myRoom      = null;
let currentRoom = null;
let wasRevealed = false;
let wasAdmin    = false;
let prevPlayerIds = [];
let timerInterval = null;
let rejoining   = false;

// Toggle helper
// ── Bouncing card physics engine ───────────────────────────────────────────
function createBouncingCards(container, count, getW, getH) {
  const suits = ['♠', '♥', '♦', '♣'];
  const CW = 44, CH = 62;

  function jitteredGrid(W, H, cardObjs) {
    const cols = Math.ceil(Math.sqrt(count * (W / Math.max(1, H))));
    const cellW = W / cols;
    const cellH = H / Math.ceil(count / cols);
    cardObjs.forEach((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      c.x = Math.min(col * cellW + Math.random() * Math.max(0, cellW - CW), W - CW);
      c.y = Math.min(row * cellH + Math.random() * Math.max(0, cellH - CH), H - CH);
    });
  }

  const cards = Array.from({ length: count }, (_, i) => {
    const el = document.createElement('div');
    el.className = 'ambient-card';
    el.textContent = suits[i % suits.length];
    el.style.opacity = (0.3 + Math.random() * 0.4).toFixed(2);
    container.appendChild(el);
    const speed = 0.12 + Math.random() * 0.18;
    const angle = Math.random() * Math.PI * 2;
    return {
      el,
      x: 0, y: 0,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: (Math.random() - 0.5) * 40,
      rotV: (Math.random() - 0.5) * 0.25,
    };
  });

  // Initial placement
  jitteredGrid(getW(), getH(), cards);

  function nudgeRot(c) {
    c.rotV = -c.rotV + (Math.random() - 0.5) * 0.15;
    c.rotV = Math.max(-0.55, Math.min(0.55, c.rotV));
  }

  // Redistribute cards when container size changes significantly
  let lastW = getW(), lastH = getH();
  const ro = new ResizeObserver(() => {
    const W = getW(), H = getH();
    if (Math.abs(W - lastW) / Math.max(1, lastW) > 0.15 ||
        Math.abs(H - lastH) / Math.max(1, lastH) > 0.15) {
      lastW = W; lastH = H;
      jitteredGrid(W, H, cards);
    }
  });
  ro.observe(container === screenLanding ? document.body : container);

  let rafId;
  function tick() {
    const W = getW(), H = getH();
    cards.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.rotV;
      if (c.x <= 0)      { c.x = 0;      c.vx =  Math.abs(c.vx); nudgeRot(c); }
      if (c.x >= W - CW) { c.x = W - CW; c.vx = -Math.abs(c.vx); nudgeRot(c); }
      if (c.y <= 0)      { c.y = 0;      c.vy =  Math.abs(c.vy); nudgeRot(c); }
      if (c.y >= H - CH) { c.y = H - CH; c.vy = -Math.abs(c.vy); nudgeRot(c); }
      c.el.style.transform = `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`;
    });
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

// Landing screen — 15 cards
createBouncingCards(screenLanding, 15,
  () => window.innerWidth,
  () => window.innerHeight
);

// Game screen — 10 cards in dedicated ambient layer
const gameAmbientLayer = document.createElement('div');
gameAmbientLayer.className = 'game-ambient';
screenGame.appendChild(gameAmbientLayer);
createBouncingCards(gameAmbientLayer, 20,
  () => gameAmbientLayer.offsetWidth  || window.innerWidth,
  () => gameAmbientLayer.offsetHeight || window.innerHeight
);

// Track voted player IDs to detect new votes for ring animation
let prevVotedIds = new Set();

function toggleValue(btn) {
  const on = btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', String(on));
  return on;
}
[togAutoReveal, togShowAvg, togCountdown, $('tog-timer-auto-reveal')].filter(Boolean).forEach(btn => {
  btn.addEventListener('click', () => toggleValue(btn));
});

function getSettings() {
  const customDeck = selDeck.value === 'custom'
    ? ($('inp-custom-deck')?.value || '').split(',').map(v => v.trim()).filter(Boolean).slice(0, 20)
    : [];
  return {
    gameName:        inpGameName.value.trim(),
    deck:            selDeck.value,
    customDeck,
    whoCanReveal:    selWhoReveal.value,
    autoReveal:      togAutoReveal.classList.contains('active'),
    showAverage:     togShowAvg.classList.contains('active'),
    countdown:       togCountdown.classList.contains('active'),
    timerDuration:   Number($('sel-timer-duration')?.value || 120),
    timerAutoReveal: $('tog-timer-auto-reveal')?.classList.contains('active') || false,
  };
}

// Socket
const socket = io();
socket.on('room-joined', ({ roomCode, sessionToken }) => {
  myRoom = roomCode;
  roomCodeDisplay.textContent = roomCode;
  if (sessionToken) {
    sessionStorage.setItem('pp_session', JSON.stringify({ roomCode, sessionToken }));
  }
  if (jiraSession) socket.emit('link-jira-session', { jiraSessionId: jiraSession });
  showScreen('game');
  const url = new URL(window.location.href);
  url.searchParams.set('room', roomCode);
  window.history.replaceState({}, '', url.toString());
});

socket.on('room-update', (room) => {
  const justRevealed = room.revealed && !wasRevealed;
  wasRevealed = room.revealed;

  const me = Object.values(room.players).find(p => p.id === myId);
  if (me?.isAdmin && !wasAdmin && currentRoom) showToast(`You are now the host ${ICON_STAR}`, 'host');
  wasAdmin = me?.isAdmin || false;

  // Toast notifications for join/leave
  const newIds = Object.keys(room.players);
  if (currentRoom) {
    const oldIds = prevPlayerIds;
    newIds.filter(id => !oldIds.includes(id) && id !== myId).forEach(id => {
      showToast(`${escHtml(room.players[id]?.name || 'Someone')} joined`, 'join');
    });
    oldIds.filter(id => !newIds.includes(id)).forEach(id => {
      const name = currentRoom.players[id]?.name || 'Someone';
      showToast(`${escHtml(name)} left`, 'leave');
    });
  }
  const prevPlayerIdsSnap = [...prevPlayerIds]; // snapshot before update for pop-in anim
  prevPlayerIds = newIds;
  currentRoom = room;

  syncTimer(room.timer);

  if (justRevealed) {
    const voters     = Object.values(room.players).filter(p => !p.isSpectator);
    const devCount   = voters.filter(p => p.role === 'dev').length;
    const qaCount    = voters.filter(p => p.role === 'qa').length;
    const flipMs     = (Math.max(devCount, qaCount, 1) - 1) * 140 + 650;
    const countdownMs = room.settings?.countdown ? 3 * 900 : 0;
    setTimeout(() => toggleSidebar(true), countdownMs + flipMs);
  }

  if (justRevealed && room.settings?.countdown) {
    doCountdown(() => render(room, true, prevPlayerIdsSnap));
  } else {
    render(room, justRevealed, prevPlayerIdsSnap);
  }
});

socket.on('error-msg', (msg) => { landingError.textContent = msg; });

socket.on('ai-card-majority', ({ issueKey, playerCount, team }) => {
  const countdownMs = currentRoom?.settings?.countdown ? 3 * 900 : 0;
  const flipMs = (playerCount * 140) + 650;
  setTimeout(() => {
    startAiTableAnim(team);
    setAiLoading(true);
    socket.emit('ai-estimate', { issueKey, jiraSessionId: jiraSession || null, team });
  }, countdownMs + flipMs);
});

function setAiLoading(loading) {
  const btn  = $('btn-ai-estimate');
  const text = btn?.querySelector('.ai-btn-text');
  if (btn) {
    btn.classList.toggle('ai-loading', loading);
    btn.disabled = loading;
    if (text) text.textContent = loading ? 'Analyzing...' : 'AI Estimator';
  }
  // Show/hide a loading shimmer on the panel for non-admins too
  jiraEstimatePanel?.classList.toggle('ai-panel-loading', loading);
}

function startAiTableAnim(team) {
  const tables = [];
  if (team === 'dev' || team === 'both') tables.push(devPokerTable);
  if (team === 'qa'  || team === 'both') tables.push(qaPokerTable);
  tables.forEach(table => {
    if (!table) return;
    // Already animating — don't double-inject
    if (table.classList.contains('ai-thinking')) return;
    table.classList.add('ai-thinking');
    const surface = table.querySelector('.table-surface');
    if (!surface) return;

    // Shimmer overlay inside the oval surface (clips correctly)
    const overlay = document.createElement('div');
    overlay.className = 'ai-table-overlay ai-table-anim-el';
    surface.appendChild(overlay);

    // "AI Estimating..." label
    const label = document.createElement('div');
    label.className = 'ai-table-label ai-table-anim-el';
    label.innerHTML = `✦ AI Estimating<span class="ai-dots"></span>`;
    surface.appendChild(label);

    // 4 rising sparkle dots
    const sparkDelays  = [0, 0.6, 1.2, 1.8];
    const sparkSizes   = [13, 10, 11, 9];
    const sparkPcts    = [28, 45, 62, 38];
    const sparkOffsets = [0, 8, -10, 14];
    for (let i = 0; i < 4; i++) {
      const sp = document.createElement('span');
      sp.className = 'ai-table-spark ai-table-anim-el';
      sp.textContent = '✦';
      sp.style.cssText = `left:${sparkPcts[i]}%; bottom:38%; font-size:${sparkSizes[i]}px; --sx:${sparkOffsets[i]}px; animation-delay:${sparkDelays[i]}s;`;
      surface.appendChild(sp);
    }
  });
}

function stopAiTableAnim() {
  [devPokerTable, qaPokerTable].forEach(table => {
    if (!table) return;
    table.classList.remove('ai-thinking');
    const surface = table.querySelector('.table-surface');
    surface?.querySelectorAll('.ai-table-anim-el').forEach(el => el.remove());
  });
}

socket.on('ai-estimate-loading', ({ team } = {}) => {
  setAiLoading(true);
  startAiTableAnim(team || 'both');
});

socket.on('ai-estimate-result', ({ dev, qa, reasoning, team, insufficient }) => {
  setAiLoading(false);
  stopAiTableAnim();

  if (insufficient) {
    // Store reasoning as a warning — don't fill fields, don't mark as estimated
    if (jiraEstIssueId) {
      if (!jiraReasoningMap[jiraEstIssueId]) jiraReasoningMap[jiraEstIssueId] = {};
      jiraReasoningMap[jiraEstIssueId].insufficient = reasoning;
      renderReasoningBox(jiraEstIssueId);
    }
    return;
  }

  if (jiraEstIssueId && jiraEstMap[jiraEstIssueId]) {
    if (dev !== null && dev !== undefined) jiraEstMap[jiraEstIssueId].dev = String(dev);
    if (qa  !== null && qa  !== undefined) jiraEstMap[jiraEstIssueId].qa  = String(qa);
    const d = Number(jiraEstMap[jiraEstIssueId].dev);
    const q = Number(jiraEstMap[jiraEstIssueId].qa);
    if (!isNaN(d) && !isNaN(q) && jiraEstMap[jiraEstIssueId].dev && jiraEstMap[jiraEstIssueId].qa) {
      jiraEstMap[jiraEstIssueId].original = String(d + q);
    }
  }
  if (jiraEstIssueId && reasoning) {
    if (!jiraReasoningMap[jiraEstIssueId]) jiraReasoningMap[jiraEstIssueId] = {};
    // Clear any prior insufficient warning when a real estimate comes in
    delete jiraReasoningMap[jiraEstIssueId].insufficient;
    if (team === 'both') {
      jiraReasoningMap[jiraEstIssueId].both = reasoning;
    } else if (team === 'dev') {
      jiraReasoningMap[jiraEstIssueId].dev = reasoning;
    } else if (team === 'qa') {
      jiraReasoningMap[jiraEstIssueId].qa = reasoning;
    }
  }
  if (jiraEstIssueId) {
    if (!aiFilledFields[jiraEstIssueId]) aiFilledFields[jiraEstIssueId] = new Set();
    if (dev !== null && dev !== undefined) aiFilledFields[jiraEstIssueId].add('dev');
    if (qa  !== null && qa  !== undefined) aiFilledFields[jiraEstIssueId].add('qa');
    if (dev !== null && dev !== undefined && qa !== null && qa !== undefined) aiFilledFields[jiraEstIssueId].add('original');
  }

  const devEl  = $('est-dev');
  const qaEl   = $('est-qa');
  const origEl = $('est-original');

  if (dev !== null && dev !== undefined && devEl)  { devEl.value  = dev; devEl.classList.add('ai-filled'); }
  if (qa  !== null && qa  !== undefined && qaEl)   { qaEl.value   = qa;  qaEl.classList.add('ai-filled'); }
  if (dev !== null && dev !== undefined && qa !== null && qa !== undefined && origEl) {
    origEl.value = dev + qa; origEl.classList.add('ai-filled');
  }

  if (jiraEstIssueId) renderReasoningBox(jiraEstIssueId);

  const btn = $('btn-ai-estimate');
  if (btn) {
    btn.classList.add('ai-done');
    setTimeout(() => btn.classList.remove('ai-done'), 2000);
  }
});

socket.on('ai-estimate-error', ({ error }) => {
  setAiLoading(false);
  stopAiTableAnim();
  showToast(`AI estimate failed: ${escHtml(error)}`, 'leave');
});

// Auto-rejoin if session stored (page refresh)
(function tryRejoin() {
  const raw = sessionStorage.getItem('pp_session');
  if (!raw) return;
  try {
    const { roomCode, sessionToken } = JSON.parse(raw);
    if (!roomCode || !sessionToken) return;

    rejoining = true;

    const overlay = document.createElement('div');
    overlay.id = 'rejoin-overlay';
    overlay.innerHTML = `
      <div class="rejoin-cards">
        <div class="rejoin-card">♠</div>
        <div class="rejoin-card">♥</div>
        <div class="rejoin-card">♦</div>
        <div class="rejoin-card">♣</div>
      </div>
      <div class="rejoin-text">Reconnecting...</div>`;
    document.body.appendChild(overlay);

    function dismiss() {
      overlay.classList.add('fade-out');
      setTimeout(() => overlay.remove(), 370);
    }

    let settled = false;
    socket.once('room-joined', () => { settled = true; dismiss(); });
    socket.once('error-msg', () => {
      if (settled) return;
      settled = true;
      rejoining = false;
      sessionStorage.removeItem('pp_session');
      dismiss();
    });
    socket.connect();
    socket.once('connect', () => {
      socket.emit('rejoin-room', { sessionToken });
    });
  } catch (e) {
    rejoining = false;
    sessionStorage.removeItem('pp_session');
  }
})();

// URL auto-fill
const urlRoom = new URLSearchParams(window.location.search).get('room');
if (urlRoom) {
  inpRoomCode.value = urlRoom.toUpperCase();
  switchTab('join');
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `tab-${tab}`));
}

inpRoomCode.addEventListener('input', () => { inpRoomCode.value = inpRoomCode.value.toUpperCase(); });

// Landing
btnCreate.addEventListener('click', () => {
  const name = inpName.value.trim();
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  landingError.textContent = '';
  if (!socket.connected) socket.connect();
  const createRole = selRole.value;
  socket.emit('create-room', { name, settings: getSettings(), role: createRole, isSpectator: createRole === 'spectator', avatar: myAvatar });
});

btnJoin.addEventListener('click', () => {
  const name = inpName.value.trim();
  const code = inpRoomCode.value.trim().toUpperCase();
  const joinRole = selRole.value;
  const isSpectator = joinRole === 'spectator';
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  if (!code) { landingError.textContent = 'Please enter a room code.'; return; }
  landingError.textContent = '';
  if (!socket.connected) socket.connect();
  socket.emit('join-room', { name, roomCode: code, isSpectator, role: joinRole, avatar: myAvatar });
});

inpName.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const tab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (tab === 'create') btnCreate.click(); else btnJoin.click();
});
inpRoomCode.addEventListener('keydown', e => { if (e.key === 'Enter') btnJoin.click(); });

// Game actions
$('btn-home').addEventListener('click', () => {
  sessionStorage.removeItem('pp_session');
  socket.disconnect();
  myRoom = null; myId = null; currentRoom = null;
  wasRevealed = false; wasAdmin = false; prevPlayerIds = [];
  window.history.replaceState({}, '', '/');
  showScreen('landing');
});

btnCopyLink.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('room', myRoom);
  navigator.clipboard.writeText(url.toString()).then(() => {
    btnCopyLink.textContent = 'Copied!';
    btnCopyLink.classList.add('copied');
    setTimeout(() => { btnCopyLink.textContent = 'Copy Link'; btnCopyLink.classList.remove('copied'); }, 2000);
  });
});

btnLeave.addEventListener('click', () => {
  sessionStorage.removeItem('pp_session');
  socket.disconnect();
  currentRoom = null;
  wasRevealed = false;
  wasAdmin    = false;
  myRoom      = null;
  screenGame.classList.remove('active');
  screenLanding.classList.add('active');
});

btnTransferHost.addEventListener('click', () => {
  if (!currentRoom) return;
  const players = Object.values(currentRoom.players).filter(p => p.id !== myId);
  transferList.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.className = 'transfer-item';
    li.innerHTML = `<div class="transfer-item-avatar">${getInitials(p.name)}</div><span>${escHtml(p.name)}${p.isSpectator ? ` ${ICON_EYE}` : ''} <small style="color:var(--muted)">(${p.role})</small></span>`;
    li.addEventListener('click', () => {
      socket.emit('transfer-host', { toId: p.id });
      transferModal.classList.add('hidden');
    });
    transferList.appendChild(li);
  });
  transferModal.classList.remove('hidden');
});
btnTransferCancel.addEventListener('click', () => transferModal.classList.add('hidden'));
transferModal.addEventListener('click', e => { if (e.target === transferModal) transferModal.classList.add('hidden'); });

btnReveal.addEventListener('click', () => socket.emit('reveal-cards'));
btnNewRound.addEventListener('click', () => { wasRevealed = false; socket.emit('new-round'); });

// Dealer visibility
let localDealersHidden = false; // player-local override
function applyDealerVisibility(hiddenForAll) {
  const hide = hiddenForAll || localDealersHidden;
  document.querySelectorAll('.dealer, .dealer-hands, .dlr-label').forEach(el => {
    el.style.visibility = hide ? 'hidden' : '';
  });
  chkToggleDealers.checked = !hide; // checked = dealers visible
}

chkToggleDealers.addEventListener('change', () => {
  if (wasAdmin) {
    socket.emit('toggle-dealers');
  } else {
    localDealersHidden = !chkToggleDealers.checked;
    applyDealerVisibility(currentRoom?.dealersHidden || false);
  }
});

// Issues sidebar
function toggleSidebar(open) {
  issuesSidebar.classList.toggle('open', open);
  btnIssuesToggle.classList.toggle('sidebar-open', open);
  setTimeout(() => onResize(), 420); // wait for 0.4s CSS transition to finish
}
btnIssuesToggle.addEventListener('click', () => toggleSidebar(!issuesSidebar.classList.contains('open')));
btnSidebarClose.addEventListener('click', () => toggleSidebar(false));

btnAddIssue.addEventListener('click', addIssue);
inpIssue.addEventListener('keydown', e => { if (e.key === 'Enter') addIssue(); });
function addIssue() {
  const t = inpIssue.value.trim();
  if (!t) return;
  socket.emit('add-issue', { title: t });
  inpIssue.value = '';
}

// Timer
btnTimerStart.addEventListener('click', () => socket.emit('timer-start'));
btnTimerPause.addEventListener('click', () => socket.emit('timer-pause'));
btnTimerReset.addEventListener('click', () => socket.emit('timer-reset'));

// ── Reactions ─────────────────────────────────────────────────────────────────
(function initReactions() {
  const trigger  = $('react-trigger');
  const popover  = $('react-popover');
  if (!trigger || !popover) return;

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const open = popover.classList.toggle('hidden');
    trigger.classList.toggle('active', !open);
  });

  document.addEventListener('click', () => {
    popover.classList.add('hidden');
    trigger.classList.remove('active');
  });

  popover.querySelectorAll('.react-emoji-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      socket.emit('react', { emoji: btn.dataset.emoji });
      // Arm this emoji for throwing
      selectedThrowEmoji = btn.dataset.emoji;
      popover.querySelectorAll('.react-emoji-btn').forEach(b => b.classList.remove('throw-armed'));
      btn.classList.add('throw-armed');
    });
  });
})();

// ── Throw mechanic ────────────────────────────────────────────────────────────
let selectedThrowEmoji = null;

const tablesContainer = $('tables-container');
if (tablesContainer) {
  tablesContainer.addEventListener('click', e => {
    if (!selectedThrowEmoji || !myId) return;
    if (e.target.closest('#dealer-toggle')) return;
    if (e.target.closest('.table-issue-view-btn')) return;
    const mySeat = document.querySelector(`.player-seat[data-player-id="${myId}"], .spectator-seat[data-player-id="${myId}"]`);
    if (!mySeat) return;
    const cr = tablesContainer.getBoundingClientRect();
    const r  = mySeat.getBoundingClientRect();
    // Normalize relative to the tables-container so coordinates are screen-size independent
    const fromX = (r.left + r.width  / 2 - cr.left) / cr.width;
    const fromY = (r.top  + r.height / 2 - cr.top)  / cr.height;
    const toX   = (e.clientX - cr.left) / cr.width;
    const toY   = (e.clientY - cr.top)  / cr.height;
    socket.emit('emoji-throw', { emoji: selectedThrowEmoji, fromX, fromY, toX, toY });
  });
}

const CUSTOM_THROW_IMGS = {
  sergio:       'images/SergioHead.png',
  danan:        'images/DananHead.png',
  parrot:       'images/christmas_parrot.gif',
  party_blob:   'images/party_blob.gif',
  elmo_money:   'images/elmo-money.gif',
  this_is_fine: 'images/this_is_fine.gif',
  spongebob:    'images/spongebob1q.gif',
  smart:        'images/smart.gif',
  rage:         'images/rage.jpg',
  success:      'images/success.png',
  poop:         'images/poop.gif',
  rage_poop:    'images/rage-poop.png',
  poop_fire:    'images/poopfire.gif',
  poop_sob:     'images/poopsob.png',
  sad_poop:     'images/sad_poop.png',
};

function animateThrow(emoji, fromX, fromY, toX, toY) {
  // Denormalize relative to tables-container so the throw lands in the same
  // proportional spot on every screen size
  const tc = $('tables-container');
  const cr = tc ? tc.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const startX = cr.left + fromX * cr.width;
  const startY = cr.top  + fromY * cr.height;
  const endX   = cr.left + toX   * cr.width;
  const endY   = cr.top  + toY   * cr.height;
  const dx = endX - startX;
  const dy = endY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const duration = Math.max(600, dist * 1.1);
  const arcHeight = Math.min(180, dist * 0.45);

  const el = document.createElement('div');
  el.className = 'flying-emoji';
  el.style.cssText = `position:fixed;top:0;left:0;pointer-events:none;z-index:9998;font-size:28px;line-height:1;`;

  if (CUSTOM_THROW_IMGS[emoji]) {
    const img = document.createElement('img');
    img.src = CUSTOM_THROW_IMGS[emoji];
    img.style.cssText = 'width:36px;height:36px;border-radius:50%;object-fit:cover;display:block;';
    el.appendChild(img);
  } else {
    el.textContent = emoji;
  }
  document.body.appendChild(el);

  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    const t = Math.min((ts - start) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const x = startX + dx * ease;
    const arc = -arcHeight * Math.sin(Math.PI * t);
    const y = startY + dy * ease + arc;
    const spin = dx >= 0 ? t * 180 : -t * 180;
    const scale = 1 + Math.sin(Math.PI * t) * 0.4;
    const opacity = t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    el.style.transform = `translate(${x}px, ${y}px) rotate(${spin}deg) scale(${scale})`;
    el.style.opacity = opacity;
    if (t < 1) requestAnimationFrame(frame);
    else el.remove();
  }
  requestAnimationFrame(frame);
}

socket.on('emoji-throw', ({ emoji, fromX, fromY, toX, toY }) => {
  animateThrow(emoji, fromX, fromY, toX, toY);
});

socket.on('reaction', ({ playerId, emoji }) => {
  const seat = document.querySelector(`.player-seat[data-player-id="${playerId}"], .spectator-seat[data-player-id="${playerId}"]`);
  if (!seat) return;
  const el = document.createElement('div');
  el.className = 'floating-reaction';
  const CUSTOM_REACTION_IMGS = {
    sergio:      'images/SergioHead.png',
    danan:       'images/DananHead.png',
    parrot:      'images/christmas_parrot.gif',
    party_blob:  'images/party_blob.gif',
    elmo_money:  'images/elmo-money.gif',
    this_is_fine:'images/this_is_fine.gif',
    spongebob:   'images/spongebob1q.gif',
    smart:       'images/smart.gif',
    rage:        'images/rage.jpg',
    success:     'images/success.png',
    poop:        'images/poop.gif',
    rage_poop:   'images/rage-poop.png',
    poop_fire:   'images/poopfire.gif',
    poop_sob:    'images/poopsob.png',
    sad_poop:    'images/sad_poop.png',
  };
  if (CUSTOM_REACTION_IMGS[emoji]) {
    const img = document.createElement('img');
    img.src = CUSTOM_REACTION_IMGS[emoji];
    img.style.cssText = 'width:36px;height:36px;border-radius:50%;object-fit:cover;display:block;';
    el.appendChild(img);
  } else {
    el.textContent = emoji;
  }
  // Position at top-center of the seat
  el.style.left = '50%';
  el.style.top  = '0';
  el.style.transform = 'translateX(-50%)';
  seat.appendChild(el);
  el.addEventListener('animationend', () => el.remove());
});

function syncTimer(timer) {
  if (!timer) return;
  clearInterval(timerInterval);
  const duration = (timer.duration || currentRoom?.settings?.timerDuration || 120) * 1000;

  const getRemaining = () => {
    const elapsed = (timer.elapsed || 0) + (timer.running ? Date.now() - timer.startedAt : 0);
    return Math.max(0, duration - elapsed);
  };

  const updateDisplay = () => {
    const rem = getRemaining();
    timerDisplay.textContent = formatMs(rem);
    const isUrgent = rem <= 30000 && rem > 0;
    timerDisplay.classList.toggle('timer-urgent', isUrgent);
    if (rem === 0) {
      timerDisplay.classList.add('timer-expired');
      timerDisplay.classList.remove('timer-urgent', 'running');
      clearInterval(timerInterval);
      // Auto-reveal when timer hits zero (host only)
      if (wasAdmin && currentRoom?.settings?.timerAutoReveal && !currentRoom?.revealed) {
        socket.emit('reveal-cards');
      }
    }
  };

  if (timer.running) {
    timerDisplay.classList.add('running');
    timerDisplay.classList.remove('timer-expired');
    btnTimerStart.classList.add('hidden');
    btnTimerPause.classList.remove('hidden');
    updateDisplay();
    timerInterval = setInterval(updateDisplay, 500);
  } else {
    timerDisplay.classList.remove('running', 'timer-expired', 'timer-urgent');
    btnTimerStart.classList.remove('hidden');
    btnTimerPause.classList.add('hidden');
    updateDisplay();
  }
}

function formatMs(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

// Resize — also fires on browser zoom via visualViewport
function onResize() {
  if (currentRoom) {
    const players = Object.values(currentRoom.players);
    sizeTables();
    renderTeamPlayers(players.filter(p => p.role === 'dev'), currentRoom.revealed, false, 'dev');
    renderTeamPlayers(players.filter(p => p.role === 'qa'),  currentRoom.revealed, false, 'qa');
    renderSpectators(players.filter(p => p.isSpectator));
  }
}
window.addEventListener('resize', onResize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

// Countdown
function doCountdown(callback) {
  let count = 3;
  countdownNumber.textContent = count;
  countdownOverlay.classList.remove('hidden');
  const tick = () => {
    count--;
    if (count > 0) {
      countdownNumber.textContent = count;
      countdownNumber.style.animation = 'none';
      void countdownNumber.offsetWidth;
      countdownNumber.style.animation = '';
      setTimeout(tick, 900);
    } else {
      countdownOverlay.classList.add('hidden');
      callback();
    }
  };
  setTimeout(tick, 900);
}

// Toast
// ── Ticket detail modal ───────────────────────────────────────────────────────
async function openTicketModal(issueKey) {
  // Remove any existing modal
  document.getElementById('ticket-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'ticket-modal';
  modal.className = 'ticket-modal-overlay';
  modal.innerHTML = `
    <div class="ticket-modal">
      <div class="ticket-modal-header">
        <span class="ticket-modal-key">${escHtml(issueKey)}</span>
        <button class="ticket-modal-close" id="ticket-modal-close">✕</button>
      </div>
      <div class="tm-toolbar" id="tm-toolbar">
        <select class="tm-tb-select" id="tm-tb-style" title="Text style">
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="h5">Heading 5</option>
          <option value="h6">Heading 6</option>
        </select>
        <span class="tm-tb-sep"></span>
        <button class="tm-tb-btn" data-cmd="bold"          title="Bold (Ctrl+B)"><b>B</b></button>
        <button class="tm-tb-btn" data-cmd="italic"        title="Italic (Ctrl+I)"><em>I</em></button>
        <button class="tm-tb-btn" data-cmd="underline"     title="Underline (Ctrl+U)"><u>U</u></button>
        <button class="tm-tb-btn" data-cmd="strikeThrough" title="Strikethrough"><s>S</s></button>
        <span class="tm-tb-sep"></span>
        <label class="tm-tb-btn tm-tb-color-label" title="Text color">
          <span class="tm-tb-color-a">A</span>
          <span class="tm-tb-color-swatch" id="tm-tb-color-swatch"></span>
          <input type="color" id="tm-tb-color" value="#000000">
        </label>
        <span class="tm-tb-sep"></span>
        <button class="tm-tb-btn" data-cmd="insertUnorderedList" title="Bullet list">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><circle cx="2.5" cy="4.5" r="1.5"/><rect x="5.5" y="3.5" width="9" height="2" rx="1"/><circle cx="2.5" cy="11.5" r="1.5"/><rect x="5.5" y="10.5" width="9" height="2" rx="1"/></svg>
        </button>
        <button class="tm-tb-btn" data-cmd="insertOrderedList" title="Numbered list">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><text x="0.5" y="7" font-size="6.5" font-family="sans-serif" font-weight="700">1.</text><rect x="5.5" y="3.5" width="9" height="2" rx="1"/><text x="0.5" y="14" font-size="6.5" font-family="sans-serif" font-weight="700">2.</text><rect x="5.5" y="10.5" width="9" height="2" rx="1"/></svg>
        </button>
        <span class="tm-tb-sep"></span>
        <button class="tm-tb-btn" id="tm-tb-link" title="Insert link">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 9.5a3.54 3.54 0 0 0 5 0l1.5-1.5a3.54 3.54 0 0 0-5-5L7 4" stroke-linecap="round"/><path d="M9.5 6.5a3.54 3.54 0 0 0-5 0L3 8a3.54 3.54 0 0 0 5 5L9 12" stroke-linecap="round"/></svg>
        </button>
        <button class="tm-tb-btn" data-cmd="formatBlock" data-val="blockquote" title="Blockquote">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M3 2h4v6H5c0 1.1.9 2 2 2v2a4 4 0 0 1-4-4V2zm6 0h4v6h-2c0 1.1.9 2 2 2v2a4 4 0 0 1-4-4V2z"/></svg>
        </button>
        <button class="tm-tb-btn" data-cmd="formatBlock" data-val="pre" title="Code block">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5.7 11.3L2.4 8l3.3-3.3-1-1L.3 8l4.4 4.3 1-1zM10.3 11.3l3.3-3.3-3.3-3.3 1-1L15.7 8l-4.4 4.3-1-1z"/></svg>
        </button>
        <button class="tm-tb-btn" data-cmd="removeFormat" title="Clear formatting">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 2.5h12v1.5h-4l-1 3.5h2.3L7 13.5 5.5 8H3l1.2-4H2V2.5z"/><line x1="12" y1="10" x2="15" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="15" y1="10" x2="12" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="ticket-modal-body" id="ticket-modal-body">
        <div class="ticket-modal-loading">
          <div class="ticket-modal-spinner"></div>
          <span>Loading ticket...</span>
        </div>
      </div>
      <div class="tm-save-bar" id="tm-save-bar">
        <span class="tm-save-hint">Unsaved changes</span>
        <button class="tm-discard-btn" id="tm-discard-btn">Discard</button>
        <button class="tm-save-all-btn" id="tm-save-all-btn">Save Changes</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.addEventListener('click', e => { if (e.target === modal) closeTicketModal(); });
  document.getElementById('ticket-modal-close').addEventListener('click', closeTicketModal);
  document.addEventListener('keydown', onEscTicket);

  try {
    let data;
    if (jiraSession) {
      data = await jiraGet(`/api/jira/issue/${issueKey}`);
    } else if (myRoom) {
      const res = await fetch(`/api/jira/room/${encodeURIComponent(myRoom)}/issue/${encodeURIComponent(issueKey)}`, { cache: 'no-store' });
      data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    } else {
      throw new Error('No Jira session — ask the host to link Jira.');
    }
    renderTicketModal(data);
  } catch (err) {
    document.getElementById('ticket-modal-body').innerHTML =
      `<div class="ticket-modal-error">Failed to load ticket: ${escHtml(err.message)}</div>`;
  }
}

function closeTicketModal() {
  const m = document.getElementById('ticket-modal');
  if (m) { m.classList.add('closing'); setTimeout(() => m.remove(), 220); }
  document.removeEventListener('keydown', onEscTicket);
}

function onEscTicket(e) { if (e.key === 'Escape') closeTicketModal(); }

function renderTicketModal(d) {
  const statusColor = {
    'To Do': '#64748b', 'In Progress': '#3448ff', 'In Review': '#8b5cf6',
    'Done': '#22c55e', 'Closed': '#22c55e', 'Resolved': '#22c55e',
  }[d.status] || '#64748b';

  const badge = (text, color) => text
    ? `<span class="tm-badge" style="background:${color}20;color:${color};border-color:${color}40">${escHtml(text)}</span>`
    : '';

  const editableSection = (title, content) => content
    ? `<div class="tm-section">
        <div class="tm-section-title">${title}</div>
        <div class="tm-section-body adf-body">${content}</div>
       </div>`
    : '';

  const section = (title, content) => content
    ? `<div class="tm-section"><div class="tm-section-title">${title}</div><div class="tm-section-body">${content}</div></div>`
    : '';

  const descHtml = d.description || '<em class="tm-muted">No description</em>';

  const commentsHtml = d.comments?.length
    ? `<div class="tm-comments-body">${d.comments.map(c => `
        <div class="tm-comment">
          <div class="tm-comment-meta"><strong>${escHtml(c.author)}</strong> · ${escHtml(c.date || '')}</div>
          <div class="tm-comment-body adf-body">${c.html || ''}</div>
        </div>`).join('')}</div>`
    : '';

  const linkedHtml = d.linkedIssues?.length
    ? d.linkedIssues.map(l => `<div class="tm-linked-item">${escHtml(l)}</div>`).join('') : '';

  const subtasksHtml = d.subtasks?.length
    ? d.subtasks.map(s => `<div class="tm-linked-item">${escHtml(s)}</div>`).join('') : '';

  const extraSectionsHtml = (d.extraSections || []).map(s =>
    editableSection(escHtml(s.label), s.html || '', s.fieldId, s.text)
  ).join('');

  const attachmentsPlaceholder = (d.attachments || []).length
    ? `<div class="tm-section"><div class="tm-section-title">Attachments</div><div class="tm-attachments-grid" id="tm-attachments-grid"></div></div>`
    : '';

  document.getElementById('ticket-modal-body').innerHTML = `
    <div class="tm-section">
      <div class="tm-summary">${escHtml(d.summary)}</div>
    </div>
    <div class="tm-meta">
      ${badge(d.status,   statusColor)}
      ${badge(d.type,     '#64748b')}
      ${badge(d.priority, d.priority === 'High' || d.priority === 'Highest' ? '#ef4444' : '#64748b')}
      ${d.assignee ? `<span class="tm-assignee">${ICON_PERSON} ${escHtml(d.assignee)}</span>` : ''}
      ${d.epic ? badge('Epic: ' + d.epic, '#8b5cf6') : ''}
    </div>
    ${d.labels?.length ? `<div class="tm-labels">${d.labels.map(l => `<span class="tm-label">${escHtml(l)}</span>`).join('')}</div>` : ''}
    ${editableSection('Description', descHtml, 'description', d.descriptionText)}
    ${extraSectionsHtml}
    ${section('Subtasks', subtasksHtml)}
    ${section('Linked Issues', linkedHtml)}
    ${attachmentsPlaceholder}
    ${section('Comments', commentsHtml)}
  `;

  // ── Contenteditable change tracking & save bar ───────────────────────────
  const modalBody  = document.getElementById('ticket-modal-body');
  const saveBar    = document.getElementById('tm-save-bar');
  const saveAllBtn = document.getElementById('tm-save-all-btn');
  const discardBtn = document.getElementById('tm-discard-btn');

  // Edit/comment functionality disabled — view only

  // ── Rich text toolbar ───────────────────────────────────────────────────
  const toolbar  = document.getElementById('tm-toolbar');
  const tbStyle  = document.getElementById('tm-tb-style');
  const tbColor  = document.getElementById('tm-tb-color');
  const tbSwatch = document.getElementById('tm-tb-color-swatch');
  const tbLink   = document.getElementById('tm-tb-link');
  let hideToolbarTimer = null;

  const showToolbar = () => { clearTimeout(hideToolbarTimer); toolbar.classList.add('active'); };
  const scheduleHide = () => {
    hideToolbarTimer = setTimeout(() => {
      if (!toolbar.contains(document.activeElement) &&
          !modalBody.querySelector('.tm-editable:focus')) {
        toolbar.classList.remove('active');
      }
    }, 180);
  };

  modalBody.addEventListener('focusin',  e => { if (e.target.closest('.tm-editable')) showToolbar(); });
  modalBody.addEventListener('focusout', scheduleHide);

  // Keep focus in editable when clicking toolbar controls (but allow native select + color picker)
  toolbar.addEventListener('mousedown', e => {
    if (e.target.closest('select') || e.target.closest('input[type="color"]')) return;
    e.preventDefault();
  });

  // Generic command buttons
  toolbar.addEventListener('click', e => {
    const btn = e.target.closest('.tm-tb-btn[data-cmd]');
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val || null;
    if (cmd === 'insertUnorderedList') { insertList('ul'); return; }
    if (cmd === 'insertOrderedList')   { insertList('ol'); return; }
    // formatBlock needs angle brackets; others pass null or the raw value
    document.execCommand(cmd, false, val ? `<${val}>` : null);
    refreshToolbarState();
    saveBar.classList.add('visible');
  });

  function insertList(listType) {
    const sel = window.getSelection();
    if (!sel?.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Find the editable ancestor
    let node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const editable = node.closest?.('.tm-editable');
    if (!editable) return;

    const tag = listType.toUpperCase();

    // Direct children of the editable that the selection touches
    const selectedBlocks = [...editable.children].filter(c => range.intersectsNode(c));
    if (!selectedBlocks.length) return;

    // Toggle off if all selected blocks are already this list type
    if (selectedBlocks.every(b => b.tagName === tag)) {
      selectedBlocks.forEach(list => {
        [...list.children].forEach(li => {
          const p = document.createElement('p');
          p.innerHTML = li.innerHTML;
          editable.insertBefore(p, list);
        });
        list.remove();
      });
    } else {
      // Wrap selected blocks into a single new list
      const list = document.createElement(listType);
      list.className = 'adf-list';
      editable.insertBefore(list, selectedBlocks[0]);
      selectedBlocks.forEach(block => {
        if (block.tagName === 'UL' || block.tagName === 'OL') {
          // Absorb existing list items into the new list
          [...block.children].forEach(li => {
            const newLi = li.cloneNode(true);
            list.appendChild(newLi);
          });
        } else {
          const li = document.createElement('li');
          li.innerHTML = block.innerHTML;
          list.appendChild(li);
        }
        block.remove();
      });
    }

    editable.focus();
    saveBar.classList.add('visible');
    refreshToolbarState();
  }

  // Block style dropdown
  tbStyle.addEventListener('change', () => {
    const tag = tbStyle.value;
    document.execCommand('formatBlock', false, `<${tag}>`);
    refreshToolbarState();
    saveBar.classList.add('visible');
    modalBody.querySelector('.tm-editable:focus')?.focus();
  });

  // Text color
  tbColor.addEventListener('input', () => {
    document.execCommand('foreColor', false, tbColor.value);
    tbSwatch.style.background = tbColor.value;
    saveBar.classList.add('visible');
  });

  // Link
  tbLink.addEventListener('click', () => {
    const sel = window.getSelection();
    const existing = sel?.anchorNode?.parentElement?.closest('a');
    if (existing) { document.execCommand('unlink'); return; }
    const url = prompt('Enter URL (include https://):');
    if (url) { document.execCommand('createLink', false, url); saveBar.classList.add('visible'); }
  });

  function refreshToolbarState() {
    ['bold','italic','underline','strikeThrough','insertUnorderedList','insertOrderedList'].forEach(cmd => {
      toolbar.querySelector(`[data-cmd="${cmd}"]`)?.classList.toggle('active', document.queryCommandState(cmd));
    });
    // Block style
    const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '');
    if (tbStyle.querySelector(`option[value="${block}"]`)) tbStyle.value = block;
    // Color swatch
    const rgb = document.queryCommandValue('foreColor');
    if (rgb) {
      const hex = rgbToHex(rgb);
      if (hex) { tbSwatch.style.background = hex; tbColor.value = hex; }
    }
  }

  document.addEventListener('selectionchange', () => {
    if (document.activeElement?.closest?.('.tm-editable')) refreshToolbarState();
  });

  // Load inline images embedded in ADF description
  document.getElementById('ticket-modal-body').querySelectorAll('img.adf-inline-img').forEach(img => {
    const id = img.dataset.attachmentId;
    if (!id) return;
    fetchAttachmentBlob(id).then(({ url, type }) => {
      if (!type.startsWith('image/')) { img.style.display = 'none'; return; }
      img.src = url;
      img.style.display = 'block';
      img.addEventListener('click', () => openImageFullscreen(url));
    }).catch(() => { img.style.display = 'none'; });
  });

  // Load attachment previews asynchronously
  if (d.attachments?.length) {
    const grid = document.getElementById('tm-attachments-grid');
    d.attachments.forEach(a => renderAttachmentCard(a, grid));
  }
}

function buildReasoningHtml(r) {
  if (!r) return '';
  if (r.insufficient) {
    return `<div class="ai-reasoning-insufficient"><span class="ai-reasoning-insufficient-icon">⚠</span><span class="ai-reasoning-text">${escHtml(r.insufficient)}</span></div>`;
  }
  if (r.both) return `<span class="ai-reasoning-text">${escHtml(r.both)}</span>`;
  const parts = [];
  if (r.dev) parts.push(`<div class="ai-reasoning-section"><span class="ai-reasoning-label">Dev</span><span class="ai-reasoning-text">${escHtml(r.dev)}</span></div>`);
  if (r.qa)  parts.push(`<div class="ai-reasoning-section"><span class="ai-reasoning-label">QA</span><span class="ai-reasoning-text">${escHtml(r.qa)}</span></div>`);
  return parts.join('<hr class="ai-reasoning-divider">');
}

function renderReasoningBox(issueId) {
  const wrap = $('ai-reasoning-wrap');
  const el   = $('ai-reasoning');
  if (!wrap || !el) return;
  const r = jiraReasoningMap[issueId];
  if (!r || (!r.both && !r.dev && !r.qa)) { wrap.classList.add('hidden'); return; }
  el.innerHTML = buildReasoningHtml(r);
  wrap.classList.remove('hidden');
  el.addEventListener('scroll', () => {
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 2;
    wrap.classList.toggle('scrolled-to-bottom', atBottom);
  }, { passive: true });
}

function openReasoningModal(reasoning) {
  document.getElementById('reasoning-modal')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'reasoning-modal';
  overlay.className = 'reasoning-modal-overlay';
  overlay.innerHTML = `
    <div class="reasoning-modal">
      <div class="reasoning-modal-header">
        <span class="reasoning-modal-title">${ICON_SPARKLES} AI Estimate Reasoning</span>
        <button class="reasoning-modal-close">✕</button>
      </div>
      <div class="reasoning-modal-body">${reasoning}</div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelector('.reasoning-modal-close').addEventListener('click', () => overlay.remove());
  document.addEventListener('keydown', function onEsc(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onEsc); }
  });
}

async function fetchAttachmentBlob(id, roomSessionId) {
  let res;
  if (jiraSession) {
    res = await fetch(`/api/jira/attachment/${id}`, { headers: { 'x-jira-session': jiraSession } });
  } else if (myRoom) {
    res = await fetch(`/api/jira/room/${encodeURIComponent(myRoom)}/attachment/${id}`);
  } else {
    throw new Error('No Jira session');
  }
  if (!res.ok) throw new Error(`${res.status}`);
  const blob = await res.blob();
  return { blob, url: URL.createObjectURL(blob), type: blob.type };
}

function openImageFullscreen(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out;backdrop-filter:blur(8px)';
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:92vw;max-height:88vh;border-radius:12px;box-shadow:0 24px 80px rgba(0,0,0,0.7)';
  overlay.appendChild(img);
  overlay.addEventListener('click', () => { overlay.remove(); URL.revokeObjectURL(src); });
  document.body.appendChild(overlay);
}

async function renderAttachmentCard(a, container) {
  const card = document.createElement('div');
  card.className = 'tm-file-card';
  card.innerHTML = `<div class="tm-file-loading"><div class="tm-file-spinner"></div></div><div class="tm-file-name">${escHtml(a.name)}</div>`;
  container.appendChild(card);

  const ext = a.name.split('.').pop().toLowerCase();
  const mime = (a.mimeType || '').toLowerCase();

  try {
    const { blob, url, type } = await fetchAttachmentBlob(a.id);
    const preview = card.querySelector('.tm-file-loading');

    if (type.startsWith('image/') || /^(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(ext)) {
      const img = document.createElement('img');
      img.className = 'tm-file-img';
      img.src = url;
      img.alt = a.name;
      img.addEventListener('click', () => openImageFullscreen(url));
      preview.replaceWith(img);

    } else if (type === 'application/pdf' || ext === 'pdf') {
      const iframe = document.createElement('iframe');
      iframe.className = 'tm-file-pdf';
      iframe.src = url;
      iframe.title = a.name;
      preview.replaceWith(iframe);

    } else if (/^(docx)$/.test(ext) || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      if (typeof mammoth !== 'undefined') {
        const arrayBuf = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuf });
        const div = document.createElement('div');
        div.className = 'tm-file-docx adf-body';
        div.innerHTML = result.value;
        preview.replaceWith(div);
      } else {
        preview.replaceWith(makeDownloadBtn(url, a.name, 'Word Document'));
      }

    } else if (/^(xlsx|xls)$/.test(ext) || /spreadsheet/.test(type)) {
      if (typeof XLSX !== 'undefined') {
        const arrayBuf = await blob.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const html = XLSX.utils.sheet_to_html(ws, { editable: false });
        const div = document.createElement('div');
        div.className = 'tm-file-xlsx';
        div.innerHTML = html;
        preview.replaceWith(div);
      } else {
        preview.replaceWith(makeDownloadBtn(url, a.name, 'Spreadsheet'));
      }

    } else if (type.startsWith('video/') || /^(mp4|mov|webm|avi)$/.test(ext)) {
      const video = document.createElement('video');
      video.className = 'tm-file-video';
      video.src = url; video.controls = true;
      preview.replaceWith(video);

    } else if (type.startsWith('text/') || /^(txt|csv|md|json|xml|html|log)$/.test(ext)) {
      const text = await blob.text();
      const pre = document.createElement('pre');
      pre.className = 'tm-file-text';
      pre.textContent = text.slice(0, 5000) + (text.length > 5000 ? '\n…' : '');
      preview.replaceWith(pre);

    } else {
      // PowerPoint, unknown, etc — download button
      const label = /^(pptx?|ppt)$/.test(ext) ? 'PowerPoint' : /^(docx?)$/.test(ext) ? 'Word' : ext.toUpperCase() || 'File';
      preview.replaceWith(makeDownloadBtn(url, a.name, label));
    }
  } catch (err) {
    card.querySelector('.tm-file-loading').innerHTML = `<span class="tm-file-err">Failed to load</span>`;
  }
}

function makeDownloadBtn(url, name, label) {
  const a = document.createElement('a');
  a.href = url; a.download = name;
  a.className = 'tm-file-download';
  a.innerHTML = `${ICON_PAPERCLIP}<span>${escHtml(label)}</span><span class="tm-file-dl-hint">Click to download</span>`;
  return a;
}

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  toastsEl.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 350);
  }, 3000);
}

// ── Main render ───────────────────────────────────────────────────────────
function render(room, animateFlip = false, oldPlayerIds = []) {
  const s       = room.settings || {};
  const players = Object.values(room.players);
  const me      = players.find(p => p.id === myId);
  const isAdmin = me?.isAdmin || false;
  const canAct  = isAdmin || s.whoCanReveal === 'all';

  gameNameDisplay.textContent = s.gameName || '';

  btnTransferHost.classList.toggle('hidden', !isAdmin);
  updateJiraButton(isAdmin);
  applyDealerVisibility(room.dealersHidden || false);

  if (canAct) {
    btnReveal.classList.toggle('hidden', room.revealed);
    btnNewRound.classList.toggle('hidden', !room.revealed);
  } else {
    btnReveal.classList.add('hidden');
    btnNewRound.classList.add('hidden');
  }

  // Vote tally — per team
  const devVoters = players.filter(p => !p.isSpectator && p.role === 'dev');
  const qaVoters  = players.filter(p => !p.isSpectator && p.role === 'qa');
  const devVoted  = devVoters.filter(p => p.card !== null).length;
  const qaVoted   = qaVoters.filter(p => p.card !== null).length;

  if (room.revealed) {
    voteTally.textContent = 'Cards revealed';
  } else {
    const parts = [];
    if (devVoters.length) parts.push(`Dev ${devVoted}/${devVoters.length}`);
    if (qaVoters.length)  parts.push(`QA ${qaVoted}/${qaVoters.length}`);
    voteTally.textContent = parts.join(' · ');
  }

  sizeTables();

  const devPlayers = players.filter(p => p.role === 'dev');
  const qaPlayers  = players.filter(p => p.role === 'qa');

  // prevVotedIds already holds the previous round's voted set — renderTeamPlayers
  // compares incoming players against it to detect new votes, then we update it.
  const incomingVotedIds = new Set(players.filter(p => p.card !== null).map(p => p.id));

  renderTableCenter(devPlayers, room.revealed, s, room, 'dev');
  renderTableCenter(qaPlayers,  room.revealed, s, room, 'qa');
  renderTeamPlayers(devPlayers, room.revealed, animateFlip, 'dev', oldPlayerIds);
  renderTeamPlayers(qaPlayers,  room.revealed, animateFlip, 'qa',  oldPlayerIds);
  renderSpectators(players.filter(p => p.isSpectator));
  prevVotedIds = incomingVotedIds; // update after render so next call can diff

  // Mirror top votes onto the active issue BEFORE renderIssues so the issue list shows them
  if (room.revealed && room.activeIssueId) {
    const activeIssueForVotes = (room.issues || []).find(i => i.id === room.activeIssueId);
    if (activeIssueForVotes?.jiraKey) {
      const devTopV = getTopVote(players.filter(p => p.role === 'dev'));
      const qaTopV  = getTopVote(players.filter(p => p.role === 'qa'));
      if (devTopV) activeIssueForVotes.devEstimate = devTopV;
      if (qaTopV)  activeIssueForVotes.qaEstimate  = qaTopV;
    }
  }

  renderIssues(room.issues || [], room.activeIssueId);
  renderEstimatePanel(room, isAdmin);

  // Table ripple shockwave on reveal
  if (animateFlip) {
    [devPokerTable, qaPokerTable].forEach(table => {
      ['', 'r2', 'r3'].forEach((cls, i) => {
        setTimeout(() => {
          const r = document.createElement('div');
          r.className = 'table-ripple' + (cls ? ' ' + cls : '');
          table.appendChild(r);
          setTimeout(() => r.remove(), 1200);
        }, i * 10);
      });
    });
  }

  // Picker vs results
  if (room.revealed) {
    pickerPanel.classList.add('hidden');
    resultsPanel.classList.remove('hidden');
    renderResults(players, s, room);
  } else {
    pickerPanel.classList.remove('hidden');
    resultsPanel.classList.add('hidden');
    if (!me?.isSpectator) renderCardPicker(room.revealed, me, s.deck || 'fibonacci');
  }
}

function sizeTables() {
  const shortScreen = window.innerHeight < 820;
  [['dev', devArea, devPokerTable], ['qa', qaArea, qaPokerTable]].forEach(([team, area, table]) => {
    const aw = area.offsetWidth;
    const ah = area.offsetHeight;
    const mobile = aw < 500;
    let tw, th;
    if (mobile) {
      tw = Math.min(aw * 0.42, 220);
      th = Math.min(ah * 0.62, 320);
    } else if (shortScreen) {
      tw = Math.min(aw * 0.38, 210);
      th = Math.min(ah * 0.60, 320);
    } else {
      tw = Math.min(aw * 0.58, 380);
      th = Math.min(ah * 0.90, 700);
    }
    table.style.width  = `${tw}px`;
    table.style.height = `${th}px`;

    // Scale dealer proportionally — 1.0 at max table width (380px), shrinks below that
    const ds = Math.max(0.3, tw / 380);
    const dealer      = $(`${team}-dealer`);
    const dealerHands = $(`${team}-dealer-hands`);
    // Keep dealer proportionally anchored at all scales.
    // Original -68% = -108.8px at ds=1 looked correct; scale that offset with ds
    // so the same fraction of the dealer body sits at the table edge at any size.
    const yT = (-108.8 * ds).toFixed(1);
    const dt = `translate(-50%, ${yT}px) scale(${ds})`;
    if (dealer)      dealer.style.transform      = dt;
    if (dealerHands) dealerHands.style.transform = dt;
  });
}

const AI_CARD_VALUE = '__ai__';

function renderCardPicker(revealed, me, deckKey) {
  const cards = deckKey === 'custom'
    ? (currentRoom?.settings?.customDeck?.length ? currentRoom.settings.customDeck : DECKS.fibonacci)
    : (DECKS[deckKey] || DECKS.fibonacci);
  cardsRow.innerHTML = '';
  cards.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'pick-card';
    btn.innerHTML = cardDisplay(val);
    if (me?.card === val) btn.classList.add('selected');
    if (revealed) btn.disabled = true;
    btn.addEventListener('click', () => { if (!revealed) socket.emit('select-card', { card: val }); });
    cardsRow.appendChild(btn);
  });

  // AI card — shown when the room has a Jira session linked and this player's team hasn't been AI-estimated
  const activeIssue = (currentRoom?.issues || []).find(i => i.id === currentRoom?.activeIssueId);
  const myRole      = me?.role;
  const devDone     = activeIssue?.aiEstimatedDev || activeIssue?.aiEstimated;
  const qaDone      = activeIssue?.aiEstimatedQa  || activeIssue?.aiEstimated;
  const myTeamDone  = myRole === 'qa' ? qaDone : devDone;
  if ((jiraSession || currentRoom?.jiraSessionId) && activeIssue?.jiraKey && !myTeamDone) {
    const aiBtn = document.createElement('button');
    aiBtn.className = 'pick-card ai-card';
    aiBtn.title = 'Vote for AI Estimator — majority triggers it!';
    aiBtn.innerHTML = `${ICON_SPARKLES}<span class="ai-card-label">AI</span><span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span>`;
    if (me?.card === AI_CARD_VALUE) aiBtn.classList.add('selected');
    if (revealed) aiBtn.disabled = true;
    aiBtn.addEventListener('click', () => { if (!revealed) socket.emit('select-card', { card: AI_CARD_VALUE }); });
    cardsRow.appendChild(aiBtn);
  }
}

// Distribute N players over a 300° arc (leaving 60° gap at top for dealer)
function teamAngle(i, N) {
  if (N <= 1) return Math.PI / 2; // single player: bottom
  const ARC = (5 / 6) * 2 * Math.PI; // 300°
  return Math.PI / 2 - ARC / 2 + (i / (N - 1)) * ARC;
}

function renderTeamPlayers(teamPlayers, revealed, animateFlip, team, oldPlayerIds = []) {
  const layer = team === 'dev' ? devPlayersLayer : qaPlayersLayer;
  const area  = team === 'dev' ? devArea : qaArea;
  layer.innerHTML = '';
  if (!teamPlayers.length) return;

  const aw = area.offsetWidth;
  const ah = area.offsetHeight;
  const cx = aw / 2;
  const isMobile = aw < 500;
  const isShort  = window.innerHeight < 820;

  // Scale factor — matches dealer formula so orbits stay tight around the table
  const twForScale = isMobile ? Math.min(aw * 0.42, 220) : isShort ? Math.min(aw * 0.50, 270) : Math.min(aw * 0.58, 380);
  const sizeScale = Math.max(0.3, twForScale / 380);

  // Orbit radii scaled so players hug the table at all screen sizes
  const rx = Math.min(aw * (isMobile ? 0.28 : 0.36), 210) * sizeScale;
  const ry = Math.min(ah * (isMobile ? 0.30 : 0.45), 300) * sizeScale;
  const cy = ah / 2 + (isMobile ? ah * 0.06 : 0);

  // Separate spectators — they go in the center, not the orbit
  const voters     = teamPlayers.filter(p => !p.isSpectator);
  const spectators = teamPlayers.filter(p => p.isSpectator);

  // Put "me" near the middle of the arc (bottom position)
  const myIdx = voters.findIndex(p => p.id === myId);
  let ordered = [...voters];
  if (myIdx >= 0) {
    const mid = Math.floor((voters.length - 1) / 2);
    ordered.splice(myIdx, 1);
    ordered.splice(mid, 0, voters[myIdx]);
  }

  const N = ordered.length;
  const crowdScale = N <= 9 ? 1.0 : Math.max(0.55, 1.0 - (N - 9) * 0.05);
  const scale = sizeScale * crowdScale;

  ordered.forEach((player, i) => {
    const angle = teamAngle(i, N);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const isMe    = player.id === myId;
    const hasVoted = player.card !== null;

    const seat = document.createElement('div');
    seat.className  = 'player-seat';
    seat.dataset.playerId = player.id;
    seat.style.left = `${x}px`;
    seat.style.top  = `${y}px`;
    seat.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const wrap  = document.createElement('div');
    wrap.className = 'player-card-wrap';
    const inner = document.createElement('div');
    inner.className = 'player-card-inner';
    if (revealed && hasVoted && !animateFlip) inner.classList.add('flipped');

    const back = document.createElement('div');
    back.className = hasVoted ? 'card-face card-back' : 'card-face card-empty';
    if (!hasVoted) back.textContent = '·';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    if (revealed && hasVoted) {
      const v = player.card;
      if (v === AI_CARD_VALUE) {
        front.classList.add('ai-card');
        front.innerHTML = `${ICON_SPARKLES}<span class="ai-card-label">AI</span><span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span>`;
      } else {
        front.innerHTML = `<span class="cv-center">${cardDisplay(v)}</span>`;
      }
    }

    inner.appendChild(back);
    inner.appendChild(front);
    wrap.appendChild(inner);

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar' + (isMe ? ' is-me' : '') + (player.isAdmin ? ' is-admin' : '');
    if (player.avatar) {
      const avatarImg = document.createElement('img');
      avatarImg.src = player.avatar;
      avatarImg.alt = player.name;
      avatar.appendChild(avatarImg);
    } else {
      avatar.textContent = getInitials(player.name);
    }
    avatar.title = (player.isAdmin ? '(host) ' : '') + player.name;

    const nameEl = document.createElement('div');
    nameEl.className = 'player-name' + (isMe ? ' is-me' : '');
    nameEl.innerHTML = isMe
      ? `${escHtml(player.name)} (You)`
      : escHtml(player.name) + (player.isAdmin ? ` ${ICON_STAR}` : '');

    seat.appendChild(wrap);
    seat.appendChild(avatar);
    seat.appendChild(nameEl);
    layer.appendChild(seat);

    // Pop-in animation for newly joined players
    if (oldPlayerIds.length > 0 && !oldPlayerIds.includes(player.id)) {
      wrap.classList.add('card-wrap-in');
    }

    // Voted ring burst when a player just cast their vote
    if (hasVoted && !prevVotedIds.has(player.id) && !revealed) {
      wrap.style.position = 'relative';
      const ring = document.createElement('div');
      ring.className = 'vote-ring';
      wrap.appendChild(ring);
      setTimeout(() => ring.remove(), 800);
    }

    if (animateFlip && revealed && hasVoted) {
      setTimeout(() => inner.classList.add('flipped'), i * 140);
    }
  });

}

function renderSpectators(spectators) {
  spectatorsLayer.innerHTML = '';
  spectators.forEach((player, i) => {
    const total = spectators.length;
    const offsetY = total > 1 ? (i - (total - 1) / 2) * 60 : 0;
    const isMe = player.id === myId;

    const seat = document.createElement('div');
    seat.className = 'spectator-seat';
    seat.dataset.playerId = player.id;
    seat.style.transform = `translateY(${offsetY}px)`;

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar is-spectator' + (isMe ? ' is-me' : '') + (player.isAdmin ? ' is-admin' : '');
    if (player.avatar) {
      const img = document.createElement('img');
      img.src = player.avatar;
      img.alt = player.name;
      avatar.appendChild(img);
    } else {
      avatar.innerHTML = ICON_EYE;
    }
    avatar.title = (player.isAdmin ? '(host) ' : '') + player.name;

    const nameEl = document.createElement('div');
    nameEl.className = 'player-name is-spectator' + (isMe ? ' is-me' : '');
    nameEl.innerHTML = isMe
      ? `${escHtml(player.name)} (You)`
      : escHtml(player.name) + (player.isAdmin ? ` ${ICON_STAR}` : '');

    seat.appendChild(avatar);
    seat.appendChild(nameEl);
    spectatorsLayer.appendChild(seat);
  });
}

function renderTableCenter(teamPlayers, revealed, settings, room, team) {
  const el = team === 'dev' ? devCenterEl : qaCenterEl;
  const teamLabel = team === 'dev' ? 'Dev' : 'QA';
  const voters = teamPlayers.filter(p => !p.isSpectator);

  if (voters.length === 0) {
    el.innerHTML = `
      <div class="table-lonely">
        <div class="table-lonely-icon">${ICON_USER}</div>
        <div class="table-lonely-text">No ${teamLabel} players</div>
      </div>`;
    return;
  }

  const activeIssue = room.issues?.find(i => i.id === room.activeIssueId);
  const viewBtnHtml = activeIssue?.jiraKey
    ? `<button class="table-issue-view-btn" data-key="${escHtml(activeIssue.jiraKey)}">View Ticket</button>`
    : '';

  function attachViewBtn() {
    const viewBtn = el.querySelector('.table-issue-view-btn');
    if (viewBtn) viewBtn.addEventListener('click', () => openTicketModal(viewBtn.dataset.key));
  }

  if (!revealed) {
    const voted  = voters.filter(p => p.card !== null).length;
    const status = `${voted} / ${voters.length} voted`;

    if (activeIssue) {
      el.innerHTML = `
        <div class="table-issue-pill">
          <div class="table-issue-label">Voting on</div>
          <div class="table-issue-title">${escHtml(activeIssue.title)}</div>
          <div class="table-issue-status">${status}</div>
          ${viewBtnHtml}
        </div>`;
      attachViewBtn();
    } else {
      el.innerHTML = `<span class="table-waiting">${status}</span>`;
    }
    return;
  }

  const voted = voters.filter(p => p.card !== null && p.card !== AI_CARD_VALUE);
  const numericVotes = voted
    .map(p => p.card === '½' ? 0.5 : Number(p.card))
    .filter(n => !isNaN(n));

  if (numericVotes.length === 0) {
    el.innerHTML = `<div class="stats-with-btn"><div class="stats-wrap"><span class="stat-range">No numeric votes</span></div>${viewBtnHtml}</div>`;
    attachViewBtn();
    return;
  }

  const allCards = voted.map(p => p.card);
  const allSame  = allCards.length > 0 && allCards.every(c => c === allCards[0]);

  if (allSame) {
    el.innerHTML = `
      <div class="stats-with-btn">
        <div class="stats-wrap">
          <span class="stat-consensus">${ICON_SPARKLES} Consensus!</span>
          <span class="stat-avg">${cardDisplay(allCards[0])}</span>
          <span class="stat-label">Everyone agreed</span>
        </div>${viewBtnHtml}
      </div>`;
    attachViewBtn();
    return;
  }

  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);
  const avgStr = avg % 1 === 0 ? String(avg) : avg.toFixed(1);
  const avgHtml = settings?.showAverage !== false
    ? `<span class="stat-label">Average</span><span class="stat-avg">${avgStr}</span>`
    : '';

  el.innerHTML = `
    <div class="stats-with-btn">
      <div class="stats-wrap">
        ${avgHtml}
        <span class="stat-range">Range: ${min} – ${max}</span>
      </div>${viewBtnHtml}
    </div>`;
  attachViewBtn();
}

function renderResults(players, settings, room) {
  const devPlayers = players.filter(p => p.role === 'dev');
  const qaPlayers  = players.filter(p => p.role === 'qa');

  const devHtml = buildTeamResults(devPlayers, settings, room, 'dev', 'Dev Team');
  const qaHtml  = buildTeamResults(qaPlayers,  settings, room, 'qa',  'QA Team');

  resultsContent.innerHTML = `<div class="results-teams"><div class="results-team">${devHtml}</div><div class="results-team">${qaHtml}</div></div>`;

  // Animate bars from 0 → final height
  requestAnimationFrame(() => {
    resultsContent.querySelectorAll('.vote-bar-fill').forEach((bar, i) => {
      const target = bar.style.height;
      bar.style.height = '0';
      bar.style.transition = `height 0.55s cubic-bezier(0.4, 0, 0.2, 1) ${i * 60}ms`;
      requestAnimationFrame(() => { bar.style.height = target; });
    });
  });
}

function buildTeamResults(teamPlayers, settings, room, team, label) {
  const voters = teamPlayers.filter(p => !p.isSpectator && p.card !== null);

  if (voters.length === 0) {
    return `<div class="results-team-header">${label}</div><div class="results-no-votes">No votes</div>`;
  }

  const numericVotes = voters
    .filter(p => p.card !== AI_CARD_VALUE)
    .map(p => p.card === '½' ? 0.5 : Number(p.card))
    .filter(n => !isNaN(n));

  let statsHtml = '';
  let saveHtml  = '';

  const allCards = voters.map(p => p.card);
  const allSame  = allCards.length > 0 && allCards.every(c => c === allCards[0]);

  if (allSame) {
    statsHtml = `<div class="results-stats"><span class="results-consensus">${ICON_SPARKLES} Consensus! — ${cardDisplay(allCards[0])}</span></div>`;
  } else if (numericVotes.length > 0) {
    const avg    = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    const min    = Math.min(...numericVotes);
    const max    = Math.max(...numericVotes);
    const avgStr = avg % 1 === 0 ? String(avg) : avg.toFixed(1);
    const avgPart = settings?.showAverage !== false ? `<span class="results-avg">Avg: ${avgStr}</span>` : '';
    statsHtml = `<div class="results-stats">${avgPart}<span class="results-range">Range: ${min} – ${max}</span></div>`;
  }

  const groups = {};
  voters.forEach(p => {
    if (!groups[p.card]) groups[p.card] = [];
    groups[p.card].push(p.name);
  });

  const maxCount = Math.max(...Object.values(groups).map(n => n.length));

  const votesHtml = Object.entries(groups)
    .sort(([a], [b]) => {
      const na = a === '½' ? 0.5 : Number(a);
      const nb = b === '½' ? 0.5 : Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return 0;
    })
    .map(([val, names], _, arr) => {
      const isWinner = arr.length > 1 && names.length === Math.max(...arr.map(([, n]) => n.length));
      const label = names.length === 1 ? '1 vote' : `${names.length} votes`;
      const pct = Math.round((names.length / maxCount) * 100);
      return `
        <div class="vote-group">
          <div class="vote-bar-wrap">
            <div class="vote-bar-bg">
              <div class="vote-bar-fill${isWinner ? ' winner' : ''}" style="height:${pct}%"></div>
            </div>
          </div>
          <div class="vote-card-mini${val === AI_CARD_VALUE ? ' ai-card' : (isWinner ? ' highlight' : '')}">${val === AI_CARD_VALUE ? `${ICON_SPARKLES}<span class="ai-card-label">AI</span><span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span>` : cardDisplay(val)}</div>
          <div class="vote-names">${label}</div>
        </div>`;
    }).join('');

  return `
    <div class="results-team-header">${label}</div>
    ${statsHtml}
    <div class="results-votes">${votesHtml}</div>
    ${saveHtml}`;
}

// ── Jira Estimate Panel ────────────────────────────────────────────────────
const jiraEstimatePanel = $('jira-estimate-panel');
const jiraEstMap      = {}; // issueId → { dev, qa, original }
const jiraReasoningMap = {}; // issueId → { dev?, qa?, both? }
const aiFilledFields   = {}; // issueId → Set of field names ('dev','qa','original') that are AI-filled
let jiraEstIssueId = null;

function getTopVote(teamPlayers) {
  const voters = teamPlayers.filter(p => !p.isSpectator && p.card !== null && p.card !== AI_CARD_VALUE);
  if (!voters.length) return '';
  const counts = {};
  voters.forEach(p => { counts[p.card] = (counts[p.card] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function renderEstimatePanel(room, isAdmin) {
  const activeIssue = (room.issues || []).find(i => i.id === room.activeIssueId);

  if (!activeIssue?.jiraKey) {
    jiraEstimatePanel.classList.add('hidden');
    return;
  }

  // Clear AI reasoning when switching to a different issue
  jiraEstIssueId = activeIssue.id;

  if (!jiraEstMap[activeIssue.id]) {
    jiraEstMap[activeIssue.id] = {
      dev:      activeIssue.devEstimate      || '',
      qa:       activeIssue.qaEstimate       || '',
      original: activeIssue.originalEstimate || '',
    };
  } else {
    // Always sync from room state so AI-saved values survive re-renders
    if (activeIssue.devEstimate)      jiraEstMap[activeIssue.id].dev      = activeIssue.devEstimate;
    if (activeIssue.qaEstimate)       jiraEstMap[activeIssue.id].qa       = activeIssue.qaEstimate;
    if (activeIssue.originalEstimate) jiraEstMap[activeIssue.id].original = activeIssue.originalEstimate;
  }
  const jiraEst = jiraEstMap[activeIssue.id];

  // Auto-populate from votes when revealed
  if (room.revealed) {
    const players = Object.values(room.players);
    const devTop = getTopVote(players.filter(p => p.role === 'dev'));
    const qaTop  = getTopVote(players.filter(p => p.role === 'qa'));
    if (devTop) jiraEst.dev = devTop;
    if (qaTop)  jiraEst.qa  = qaTop;
    const devNum = parseFloat(jiraEst.dev === '½' ? 0.5 : jiraEst.dev);
    const qaNum  = parseFloat(jiraEst.qa  === '½' ? 0.5 : jiraEst.qa);
    if (!isNaN(devNum) && !isNaN(qaNum)) jiraEst.original = String(devNum + qaNum);

    // Mirror onto local room issue so the issue list shows the values immediately
    if (devTop) activeIssue.devEstimate = jiraEst.dev;
    if (qaTop)  activeIssue.qaEstimate  = jiraEst.qa;
  }

  jiraEstimatePanel.classList.remove('hidden');
  jiraEstimatePanel.innerHTML = `
    <div class="jira-est-header">
      <span class="jira-est-key">${escHtml(activeIssue.jiraKey)}</span>
      <span class="jira-est-title">Estimates</span>
    </div>
    ${(jiraSession || room.jiraSessionId) ? (() => {
      const devDone  = activeIssue.aiEstimatedDev || activeIssue.aiEstimated;
      const qaDone   = activeIssue.aiEstimatedQa  || activeIssue.aiEstimated;
      const bothDone = devDone && qaDone;
      const btnLabel = bothDone ? 'AI Estimated' : 'AI Estimator';
      return `
    <div class="ai-estimate-wrap">
      <button class="btn-ai-estimate" id="btn-ai-estimate" ${(!isAdmin || bothDone) ? 'disabled' : ''}>
        <span class="ai-btn-icon">${ICON_SPARKLES}</span>
        <span class="ai-btn-label">
          <span class="ai-btn-text">${btnLabel}</span>
          <span class="ai-btn-badge">Powered by Claude</span>
        </span>
        <span class="ai-card-spark">✦</span>
        <span class="ai-card-spark2">✦</span>
      </button>
      <div class="ai-team-popup hidden" id="ai-team-popup">
        <button class="ai-team-opt${devDone ? ' ai-team-opt--done' : ''}" id="ai-opt-dev" ${devDone ? 'disabled' : ''}>${ICON_SPARKLES} Dev Hours${devDone ? ' ✓' : ''}<span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span></button>
        <button class="ai-team-opt${qaDone  ? ' ai-team-opt--done' : ''}" id="ai-opt-qa"  ${qaDone  ? 'disabled' : ''}>${ICON_SPARKLES} QA Hours${qaDone ? ' ✓' : ''}<span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span></button>
        <button class="ai-team-opt" id="ai-opt-both" ${bothDone ? 'disabled' : ''}>${ICON_SPARKLES} Both<span class="ai-card-spark">✦</span><span class="ai-card-spark2">✦</span></button>
      </div>
    </div>`;
    })() : ''}
    <div class="ai-reasoning-wrap${jiraReasoningMap[activeIssue.id] ? '' : ' hidden'}" id="ai-reasoning-wrap">
      <div class="ai-reasoning" id="ai-reasoning">${buildReasoningHtml(jiraReasoningMap[activeIssue.id])}</div>
      <div class="ai-reasoning-fade" id="ai-reasoning-fade"></div>
    </div>
    <div class="jira-est-fields">
      <div class="jira-est-row">
        <label class="jira-est-label">Original Est. (h)</label>
        <input class="jira-est-input" id="est-original" type="number" min="0" step="0.5" value="${escHtml(jiraEst.original)}" ${isAdmin ? '' : 'disabled'}>
      </div>
      <div class="jira-est-row">
        <label class="jira-est-label">Dev Est.</label>
        <input class="jira-est-input" id="est-dev" type="number" min="0" step="0.5" value="${escHtml(jiraEst.dev)}" ${isAdmin ? '' : 'disabled'}>
      </div>
      <div class="jira-est-row">
        <label class="jira-est-label">QA Est.</label>
        <input class="jira-est-input" id="est-qa" type="number" min="0" step="0.5" value="${escHtml(jiraEst.qa)}" ${isAdmin ? '' : 'disabled'}>
      </div>
    </div>
    ${isAdmin ? `<button class="btn-save-jira" id="btn-save-jira">Save to Jira</button>` : ''}
  `;

  // Apply AI-filled ring per field
  const filledFields = aiFilledFields[activeIssue.id] || new Set();
  ['dev','qa','original'].forEach(key => {
    const el = $(`est-${key}`);
    if (el && filledFields.has(key)) el.classList.add('ai-filled');
  });

  // Wire reasoning expand — must be done after innerHTML re-render
  const reasoningWrap = $('ai-reasoning-wrap');
  if (reasoningWrap && jiraReasoningMap[activeIssue.id]) {
    reasoningWrap.addEventListener('click', () => openReasoningModal(buildReasoningHtml(jiraReasoningMap[activeIssue.id])));
  }

  // Keep local state in sync as user edits; clear ring on manual edit per field
  ['dev','qa','original'].forEach(key => {
    const el = $(`est-${key}`);
    if (!el) return;
    el.addEventListener('input', () => {
      jiraEst[key] = el.value;
      el.classList.remove('ai-filled');
      aiFilledFields[activeIssue.id]?.delete(key);
    });
  });

  const aiBtn   = $('btn-ai-estimate');
  const aiPopup = $('ai-team-popup');
  if (aiBtn && aiPopup) {
    aiBtn.addEventListener('click', e => {
      e.stopPropagation();
      aiPopup.classList.toggle('hidden');
    });
    const emitEstimate = team => {
      aiPopup.classList.add('hidden');
      socket.emit('ai-estimate', { issueKey: activeIssue.jiraKey, jiraSessionId: jiraSession || null, team });
    };
    $('ai-opt-dev')?.addEventListener('click',  () => emitEstimate('dev'));
    $('ai-opt-qa')?.addEventListener('click',   () => emitEstimate('qa'));
    $('ai-opt-both')?.addEventListener('click', () => emitEstimate('both'));
    const closePopup = e => {
      if (!aiPopup.contains(e.target) && e.target !== aiBtn) {
        aiPopup.classList.add('hidden');
        document.removeEventListener('click', closePopup);
      }
    };
    document.addEventListener('click', closePopup);
  }

  const saveBtn = $('btn-save-jira');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.textContent = 'Saving…';
      saveBtn.disabled = true;
      try {
        const res = await fetch('/api/jira/update-issue', {
          method: 'POST',
          headers: jiraHeaders(),
          body: JSON.stringify({
            issueKey:        activeIssue.jiraKey,
            devEstimate:     jiraEst.dev,
            qaEstimate:      jiraEst.qa,
            originalEstimate: jiraEst.original,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        saveBtn.textContent = '✓ Saved!';
        showToast(`Saved estimates to ${escHtml(activeIssue.jiraKey)}`, 'join');
        socket.emit('mark-issue-estimated', { id: activeIssue.id });
        socket.emit('save-team-estimate', { id: activeIssue.id, team: 'dev', estimate: jiraEst.dev });
        socket.emit('save-team-estimate', { id: activeIssue.id, team: 'qa',  estimate: jiraEst.qa });
        setTimeout(() => { if (saveBtn) { saveBtn.textContent = 'Save to Jira'; saveBtn.disabled = false; } }, 2500);
      } catch (err) {
        showToast(`Save failed: ${escHtml(err.message)}`, 'leave');
        saveBtn.textContent = 'Save to Jira';
        saveBtn.disabled = false;
      }
    });
  }
}

function renderIssues(issues, activeId) {
  issueList.innerHTML = '';
  if (!issues.length) {
    issueList.innerHTML = '<li style="padding:12px 16px;font-size:13px;color:#64748b">No issues yet. Add one below.</li>';
    return;
  }
  issues.forEach(issue => {
    const li = document.createElement('li');
    li.className = 'issue-item' + (issue.id === activeId ? ' active' : '') + (issue.savedToJira ? ' estimated' : '');

    let estHtml = '';
    if (issue.devEstimate || issue.qaEstimate) {
      const d = issue.devEstimate ? `<span class="issue-estimate dev-est">Dev: ${escHtml(issue.devEstimate)}</span>` : '';
      const q = issue.qaEstimate  ? `<span class="issue-estimate qa-est">QA: ${escHtml(issue.qaEstimate)}</span>` : '';
      estHtml = `<span class="issue-estimates">${d}${q}</span>`;
    }

    const savedBadge = issue.savedToJira
      ? `<span class="issue-saved-badge" title="Saved to Jira"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg></span>`
      : '';

    const viewTicketBtn = issue.jiraKey
      ? `<button class="issue-view-btn">View Ticket</button>`
      : '';

    li.innerHTML = `
      ${savedBadge}
      <div class="issue-title-block">
        <span class="issue-title">${escHtml(issue.title)}</span>
        ${viewTicketBtn}
      </div>
      ${estHtml}
      <button class="issue-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg></button>`;
    li.querySelector('.issue-title').addEventListener('click', () => {
      socket.emit('set-active-issue', { id: issue.id });
    });
    if (issue.jiraKey) {
      li.querySelector('.issue-view-btn').addEventListener('click', e => {
        e.stopPropagation();
        openTicketModal(issue.jiraKey);
      });
    }
    li.querySelector('.issue-delete').addEventListener('click', e => {
      e.stopPropagation();
      socket.emit('delete-issue', { id: issue.id });
    });
    issueList.appendChild(li);
  });
}

// ── Jira OAuth session ─────────────────────────────────────────────────────
let jiraSession = localStorage.getItem('jiraSession') || null;
let jiraDomain  = localStorage.getItem('jiraDomain')  || null;

function saveJiraTokenData(tokenData) {
  localStorage.setItem('jiraTokenData', JSON.stringify(tokenData));
}

function clearJiraSession() {
  jiraSession = null; jiraDomain = null;
  localStorage.removeItem('jiraSession');
  localStorage.removeItem('jiraDomain');
  localStorage.removeItem('jiraTokenData');
}

// On socket connect, restore server session from stored tokens if session key exists
socket.on('connect', () => {
  myId = socket.id;
  const raw = localStorage.getItem('jiraTokenData');
  if (jiraSession && raw) {
    try {
      const tokenData = JSON.parse(raw);
      socket.emit('restore-jira-session', { sessionId: jiraSession, ...tokenData });
    } catch {}
  }
});

// Server confirmed session is valid (tokens refreshed if needed)
socket.on('jira-session-restored', (tokenData) => {
  saveJiraTokenData(tokenData);
  // Ensure room is linked if we're already in one
  if (myRoom) socket.emit('link-jira-session', { jiraSessionId: jiraSession });
});

// Server refreshed the access token mid-session — update stored tokens
socket.on('jira-tokens-updated', (tokenData) => {
  saveJiraTokenData(tokenData);
  Auth.updateJiraTokens(tokenData.accessToken, tokenData.refreshToken, tokenData.expiresAt);
});

// Refresh token expired — clear stale session and update UI
socket.on('jira-session-invalid', () => {
  clearJiraSession();
  updateJiraButton(true);
  showToast('Jira session expired — please re-link Jira', 'leave');
});

function jiraHeaders() {
  return { 'Content-Type': 'application/json', 'x-jira-session': jiraSession || '' };
}


function updateJiraButton(isAdmin) {
  const label = jiraSession ? `Jira: ${jiraDomain}` : 'Link Jira';
  // Sidebar Jira button visible to admins only (linking requires host)
  if (isAdmin) {
    btnLinkJiraMobile.classList.remove('hidden');
    btnLinkJiraMobile.textContent = label;
    btnLinkJiraMobile.classList.toggle('jira-linked', !!jiraSession);
  } else {
    btnLinkJiraMobile.classList.add('hidden');
  }
}

btnLinkJira.addEventListener('click', () => {
  if (jiraSession) {
    // Already linked — click to unlink
    clearJiraSession();
    updateJiraButton(true);
    showToast('Jira unlinked', 'info');
    return;
  }
  const popup = window.open('/auth/jira', 'jira-auth', 'width=560,height=680,left=200,top=100');
  if (!popup) { showToast('Allow popups to link Jira', 'leave'); return; }
  const onMsg = e => {
    if (e.origin !== location.origin) return;
    if (e.data.jiraSession) {
      jiraSession = e.data.jiraSession;
      jiraDomain  = e.data.jiraDomain;
      localStorage.setItem('jiraSession', jiraSession);
      localStorage.setItem('jiraDomain',  jiraDomain);
      if (e.data.jiraTokenData) {
        saveJiraTokenData(e.data.jiraTokenData);
        // Also persist to Supabase if user is logged in
        const td = e.data.jiraTokenData;
        Auth.saveJiraConnection(jiraSession, td.accessToken, td.refreshToken, td.expiresAt, td.cloudId, td.domain);
      }
      if (myRoom) socket.emit('link-jira-session', { jiraSessionId: jiraSession });
      updateJiraButton(true);
      showToast(`Jira linked: ${escHtml(jiraDomain)}`, 'join');
      if (btnLinkJira._openImportAfterAuth) {
        btnLinkJira._openImportAfterAuth = false;
        btnJiraImport.click();
      }
    } else if (e.data.jiraError) {
      showToast(`Jira error: ${escHtml(e.data.jiraError)}`, 'leave');
    }
    window.removeEventListener('message', onMsg);
  };
  window.addEventListener('message', onMsg);
});

btnLinkJiraMobile.addEventListener('click', () => btnLinkJira.click());

// ── Jira Import ────────────────────────────────────────────────────────────
const jiraModal        = $('jira-modal');
const btnJiraImport    = $('btn-jira-import');
const btnJiraCancel    = $('btn-jira-cancel');
const btnJiraFetch     = $('btn-jira-fetch');
const jiraResults      = $('jira-results');
const inpJiraProject   = $('inp-jira-project');
const projectDropdown  = $('project-dropdown');
const selJiraFilter    = $('sel-jira-filter');
const stepFilter       = $('jira-step-filter');

// Searchable project dropdown state
let allProjects = [];
let selectedProjectKey = '';
let allFetchedIssues = [];

// Active client-side filter state
let activeFilters = { search: '', types: new Set(), versions: new Set(), labels: new Set(), priorities: new Set() };

function rgbToHex(rgb) {
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return rgb.startsWith('#') ? rgb : null;
  return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('');
}

function normalizeColor(color) {
  if (!color) return null;
  color = color.trim();
  if (color.startsWith('#')) return color.toLowerCase();
  return rgbToHex(color);
}

// ── HTML → ADF converter (mirrors our adfToHtml output back to ADF) ──────────
function htmlToAdf(el) {
  return { version: 1, type: 'doc', content: blockChildren(el) };
}

function blockChildren(el) {
  const out = [];
  for (const node of el.childNodes) {
    const b = toBlock(node);
    if (b) Array.isArray(b) ? out.push(...b) : out.push(b);
  }
  return out.length ? out : [{ type: 'paragraph', content: [] }];
}

function toBlock(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent;
    if (!t.trim()) return null;
    return { type: 'paragraph', content: [{ type: 'text', text: t }] };
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const tag = node.tagName.toLowerCase();
  const cls  = node.className || '';

  // Restore original ADF node (media, file-ref, placeholder) from data-adf attribute
  if (node.dataset?.adf) {
    try {
      const adfNode = JSON.parse(node.dataset.adf);
      // Wrap media nodes in mediaSingle so Jira renders them correctly
      if (adfNode.type === 'media') return { type: 'mediaSingle', attrs: { layout: 'center' }, content: [adfNode] };
      return adfNode;
    } catch {}
  }
  // adf-media-group div: reconstruct mediaGroup wrapping its media children
  if (cls.includes('adf-media-group')) {
    const mediaNodes = [...node.querySelectorAll('[data-adf]')].map(el => {
      try { return JSON.parse(el.dataset.adf); } catch { return null; }
    }).filter(Boolean);
    if (mediaNodes.length) return { type: 'mediaGroup', content: mediaNodes };
  }

  // Headings
  const hm = tag.match(/^h([1-6])$/) || cls.match(/adf-h([1-6])/);
  if (hm) return { type: 'heading', attrs: { level: +hm[1] }, content: inlineChildren(node) };

  if (tag === 'p')          return { type: 'paragraph',  content: inlineChildren(node) };
  if (tag === 'pre')        return { type: 'codeBlock',  content: [{ type: 'text', text: node.innerText }] };
  if (tag === 'hr')         return { type: 'rule' };
  if (tag === 'blockquote') return { type: 'blockquote', content: [{ type: 'paragraph', content: inlineChildren(node) }] };

  if (tag === 'ul') return {
    type: 'bulletList',
    content: [...node.children].filter(c => c.tagName.toLowerCase() === 'li').map(li => ({
      type: 'listItem', content: liContent(li),
    })),
  };
  if (tag === 'ol') return {
    type: 'orderedList',
    content: [...node.children].filter(c => c.tagName.toLowerCase() === 'li').map(li => ({
      type: 'listItem', content: liContent(li),
    })),
  };

  if (tag === 'table') {
    const rows = [...node.querySelectorAll('tr')].map(tr => ({
      type: 'tableRow',
      content: [...tr.children].map(cell => ({
        type: cell.tagName.toLowerCase() === 'th' ? 'tableHeader' : 'tableCell',
        content: [{ type: 'paragraph', content: inlineChildren(cell) }],
      })),
    }));
    return { type: 'table', content: rows };
  }

  // Divs and other wrappers — recurse as block container
  if (['div','section','article'].includes(tag)) return blockChildren(node);

  // Anything else — try as inline paragraph
  const inline = inlineChildren(node);
  return inline.length ? { type: 'paragraph', content: inline } : null;
}

function liContent(li) {
  // If li contains block elements, convert them; otherwise wrap inline in paragraph
  const hasBlock = [...li.childNodes].some(n =>
    n.nodeType === Node.ELEMENT_NODE &&
    ['p','ul','ol','blockquote','pre','h1','h2','h3','h4','h5','h6'].includes(n.tagName.toLowerCase())
  );
  if (hasBlock) return blockChildren(li);
  return [{ type: 'paragraph', content: inlineChildren(li) }];
}

function inlineChildren(el) {
  const out = [];
  for (const node of el.childNodes) out.push(...toInline(node, []));
  return out;
}

function toInline(node, marks) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (!text) return [];
    const n = { type: 'text', text };
    if (marks.length) n.marks = marks;
    return [n];
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const tag = node.tagName.toLowerCase();

  if (tag === 'br')  return [{ type: 'hardBreak' }];
  if (tag === 'hr')  return [{ type: 'rule' }];
  // Restore original ADF media/file nodes from data-adf attribute
  if (node.dataset?.adf) {
    try { return [JSON.parse(node.dataset.adf)]; } catch {}
  }
  if (tag === 'img') return [];

  let m = [...marks];
  if (tag === 'strong' || tag === 'b')  m = addMark(m, { type: 'strong' });
  else if (tag === 'em' || tag === 'i') m = addMark(m, { type: 'em' });
  else if (tag === 's' || tag === 'strike') m = addMark(m, { type: 'strike' });
  else if (tag === 'u')                 m = addMark(m, { type: 'underline' });
  else if (tag === 'code')              m = addMark(m, { type: 'code' });
  else if (tag === 'a') {
    const href = node.getAttribute('href') || '';
    m = addMark(m, { type: 'link', attrs: { href, title: href } });
  } else if (tag === 'font') {
    const hex = normalizeColor(node.getAttribute('color'));
    if (hex) m = addMark(m, { type: 'textColor', attrs: { color: hex } });
  } else if (tag === 'span') {
    const style = node.getAttribute('style') || '';
    const cm = style.match(/color:\s*([^;]+)/i);
    if (cm) { const hex = normalizeColor(cm[1]); if (hex) m = addMark(m, { type: 'textColor', attrs: { color: hex } }); }
  }

  const out = [];
  for (const child of node.childNodes) out.push(...toInline(child, m));
  return out;
}

function addMark(marks, mark) {
  if (marks.some(m => m.type === mark.type)) return marks;
  return [...marks, mark];
}

async function jiraGet(url) {
  const res = await fetch(url, { headers: { 'x-jira-session': jiraSession || '' }, cache: 'no-store' });
  const data = await res.json();
  if (res.status === 401) {
    clearJiraSession();
    updateJiraButton(true);
    throw new Error('Jira session expired — please re-link Jira.');
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

async function jiraPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-jira-session': jiraSession || '' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status === 401) {
    clearJiraSession();
    updateJiraButton(true);
    throw new Error('Jira session expired — please re-link Jira.');
  }
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

function renderProjectDropdown(filter) {
  const q = (filter || '').toLowerCase();
  const filtered = allProjects.filter(p =>
    p.key.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  );
  projectDropdown.innerHTML = '';
  if (!filtered.length) {
    projectDropdown.innerHTML = '<li class="proj-dd-empty">No projects found</li>';
  } else {
    filtered.forEach(p => {
      const li = document.createElement('li');
      li.className = 'proj-dd-item';
      li.textContent = `${p.key} — ${p.name}`;
      li.dataset.key = p.key;
      li.dataset.name = p.name;
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        selectProject(p.key, `${p.key} — ${p.name}`);
      });
      projectDropdown.appendChild(li);
    });
  }
  projectDropdown.classList.remove('hidden');
}

function selectProject(key, label) {
  selectedProjectKey = key;
  inpJiraProject.value = label;
  projectDropdown.classList.add('hidden');
  stepFilter.classList.remove('hidden');
  doFetch();
}

inpJiraProject.addEventListener('focus', () => {
  if (allProjects.length) renderProjectDropdown(inpJiraProject.value);
});

inpJiraProject.addEventListener('input', () => {
  selectedProjectKey = '';
  stepFilter.classList.add('hidden');
  jiraResults.classList.add('hidden');
  renderProjectDropdown(inpJiraProject.value);
});

inpJiraProject.addEventListener('blur', () => {
  setTimeout(() => projectDropdown.classList.add('hidden'), 150);
});

// Scope tab buttons
document.querySelectorAll('.jira-scope-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.jira-scope-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // sync hidden select
    selJiraFilter.value = btn.dataset.scope;
    if (selectedProjectKey) doFetch();
  });
});

btnJiraImport.addEventListener('click', async () => {
  if (!jiraSession) { btnLinkJira._openImportAfterAuth = true; btnLinkJira.click(); return; }
  jiraModal.classList.remove('hidden');

  // If already loaded, just reopen where we left off
  if (selectedProjectKey && allFetchedIssues.length) {
    if (allFetchedIssues.length) renderIssueResults();
    return;
  }

  // First open — load projects
  jiraResults.innerHTML = '';
  jiraResults.classList.add('hidden');
  stepFilter.classList.add('hidden');
  allProjects = [];
  allFetchedIssues = [];
  activeFilters = { search: '', types: new Set(), versions: new Set(), labels: new Set(), priorities: new Set() };
  selectedProjectKey = '';
  inpJiraProject.value = '';
  inpJiraProject.placeholder = 'Loading projects…';
  inpJiraProject.disabled = true;
  projectDropdown.classList.add('hidden');
  document.querySelectorAll('.jira-scope-btn').forEach(b => b.classList.toggle('active', b.dataset.scope === 'backlog'));
  selJiraFilter.value = 'backlog';

  try {
    const { projects } = await jiraGet('/api/jira/projects');
    allProjects = projects;
    inpJiraProject.placeholder = 'Type to search projects…';
    inpJiraProject.disabled = false;
    inpJiraProject.focus();
    renderProjectDropdown('');
  } catch (err) {
    inpJiraProject.placeholder = `Error: ${err.message}`;
  }
});

btnJiraFetch.addEventListener('click', doFetch);
btnJiraCancel.addEventListener('click', () => jiraModal.classList.add('hidden'));
jiraModal.addEventListener('click', e => { if (e.target === jiraModal) jiraModal.classList.add('hidden'); });

// Close filter dropdowns when clicking outside them
document.addEventListener('click', () => {
  document.querySelectorAll('.jira-filter-csel .csel-dropdown').forEach(d => d.classList.add('hidden'));
  document.querySelectorAll('.jira-filter-csel .csel-trigger').forEach(t => t.classList.remove('open'));
});

async function doFetch() {
  const projectKey = selectedProjectKey;
  if (!projectKey) return;
  jiraResults.innerHTML = '<p class="jira-fetching"><span>Fetching issues<span class="jira-fetching-dots"></span></span><span class="jira-fetching-spinner"></span></p>';
  jiraResults.classList.remove('hidden');
  allFetchedIssues = [];
  activeFilters = { search: '', types: new Set(), versions: new Set(), labels: new Set(), priorities: new Set() };

  const filter = selJiraFilter?.value || 'backlog';
  try {
    const data = await jiraGet(`/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}&filter=${encodeURIComponent(filter)}`);
    allFetchedIssues = data.issues || [];
    renderIssueResults();
  } catch (err) {
    jiraResults.innerHTML = `<p class="jira-error">${escHtml(err.message)}</p>`;
  }
}

function applyFilters() {
  return allFetchedIssues.filter(i => {
    const q = activeFilters.search;
    if (q && !i.key.toLowerCase().includes(q) && !i.title.toLowerCase().includes(q) && !i.status.toLowerCase().includes(q)) return false;
    if (activeFilters.types.size    && !activeFilters.types.has(i.type)) return false;
    if (activeFilters.versions.size && !i.fixVersions.some(v => activeFilters.versions.has(v))) return false;
    if (activeFilters.labels.size   && !i.labels.some(l => activeFilters.labels.has(l))) return false;
    if (activeFilters.priorities.size && !activeFilters.priorities.has(i.priority)) return false;
    return true;
  });
}

function renderIssueResults() {
  jiraResults.innerHTML = '';

  if (!allFetchedIssues.length) {
    jiraResults.innerHTML = '<p class="jira-empty">No issues found.</p>';
    jiraResults.classList.remove('hidden');
    return;
  }

  // Extract unique values from fetched issues
  const types      = [...new Set(allFetchedIssues.map(i => i.type).filter(Boolean))].sort();
  const versions   = [...new Set(allFetchedIssues.flatMap(i => i.fixVersions))].sort();
  const labels     = [...new Set(allFetchedIssues.flatMap(i => i.labels))].sort();
  const priorities = [...new Set(allFetchedIssues.map(i => i.priority).filter(Boolean))].sort();

  // Search
  const searchInp = document.createElement('input');
  searchInp.type = 'text';
  searchInp.className = 'jira-issue-search';
  searchInp.placeholder = 'Search issues…';
  searchInp.autocomplete = 'off';
  searchInp.value = activeFilters.search;
  searchInp.addEventListener('input', () => {
    activeFilters.search = searchInp.value.toLowerCase();
    refreshList();
  });

  // Filter bar
  const filterBar = document.createElement('div');
  filterBar.className = 'jira-filter-bar';

  function makeFilterGroup(label, values, filterKey) {
    if (!values.length) return null;

    const currentVal = activeFilters[filterKey].size ? [...activeFilters[filterKey]][0] : '';

    const wrap = document.createElement('div');
    wrap.className = 'custom-select jira-filter-csel';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'csel-trigger csel-trigger-sm';
    trigger.innerHTML = `<span class="csel-value">${escHtml(currentVal || label)}</span><span class="csel-chevron"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/></svg></span>`;

    const dropdown = document.createElement('ul');
    dropdown.className = 'csel-dropdown hidden';

    const allValues = ['', ...values];
    allValues.forEach(v => {
      const li = document.createElement('li');
      li.className = 'csel-option' + (!v && !currentVal ? ' selected' : v === currentVal ? ' selected' : '');
      li.innerHTML = `<span class="csel-opt-content"><span class="csel-opt-label">${escHtml(v || label)}</span></span><span class="csel-check"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg></span>`;
      li.addEventListener('mousedown', e => {
        e.preventDefault();
        activeFilters[filterKey] = v ? new Set([v]) : new Set();
        trigger.querySelector('.csel-value').textContent = v || label;
        dropdown.querySelectorAll('.csel-option').forEach(o => o.classList.remove('selected'));
        li.classList.add('selected');
        dropdown.classList.add('hidden');
        trigger.classList.remove('open');
        refreshList();
      });
      dropdown.appendChild(li);
    });

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = trigger.classList.contains('open');
      // close all filter dropdowns first
      filterBar.querySelectorAll('.csel-dropdown').forEach(d => d.classList.add('hidden'));
      filterBar.querySelectorAll('.csel-trigger').forEach(t => t.classList.remove('open'));
      if (!isOpen) {
        dropdown.classList.remove('hidden');
        trigger.classList.add('open');
      }
    });

    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);
    return wrap;
  }

  [
    makeFilterGroup('All Types',      types,      'types'),
    makeFilterGroup('All Versions',   versions,   'versions'),
    makeFilterGroup('All Labels',     labels,     'labels'),
    makeFilterGroup('All Priorities', priorities, 'priorities'),
  ].forEach(g => { if (g) filterBar.appendChild(g); });

  // Hint + list
  const hint = document.createElement('p');
  hint.className = 'jira-hint';

  const ul = document.createElement('ul');
  ul.className = 'jira-issue-list';

  // Scrollable list container (separate from controls so overflow doesn't clip dropdowns)
  const listWrap = document.createElement('div');
  listWrap.className = 'jira-list-wrap';
  listWrap.appendChild(hint);
  listWrap.appendChild(ul);

  function refreshList() {
    const visible = applyFilters();
    renderIssueList(ul, visible);
    hint.textContent = buildHintText(visible.length, allFetchedIssues.length);
  }

  jiraResults.appendChild(searchInp);
  if (filterBar.children.length) jiraResults.appendChild(filterBar);
  jiraResults.appendChild(listWrap);
  jiraResults.classList.remove('hidden');

  refreshList();
  searchInp.focus();
}

function buildHintText(shown, total) {
  if (shown === total) return `${total} issue${total !== 1 ? 's' : ''} — click to add`;
  return `${shown} of ${total} — click to add`;
}

function renderIssueList(ul, issues) {
  ul.innerHTML = '';
  if (!issues.length) {
    ul.innerHTML = '<li class="jira-empty" style="list-style:none;padding:8px 0">No matching issues</li>';
    return;
  }
  issues.forEach(issue => {
    const li = document.createElement('li');
    li.className = 'jira-issue-item';
    const typeBadge = issue.type ? `<span class="jira-type-badge">${escHtml(issue.type)}</span>` : '';
    li.innerHTML = `
      <span class="jira-key">${escHtml(issue.key)}</span>
      <span class="jira-summary">${escHtml(issue.title.replace(issue.key + ': ', ''))}</span>
      ${typeBadge}
      <span class="jira-status">${escHtml(issue.status)}</span>`;
    li.addEventListener('click', () => {
      socket.emit('add-issue', { title: issue.title, jiraKey: issue.key, devEstimate: issue.devEstimate, qaEstimate: issue.qaEstimate, originalEstimate: issue.originalEstimate });
      li.classList.add('jira-imported');
      li.style.opacity = '0.45';
      li.style.pointerEvents = 'none';
      showToast(`Added: ${escHtml(issue.key)}`, 'info');
    });
    ul.appendChild(li);
  });
}

// Helpers
function showScreen(name) {
  if (rejoining) {
    // Rejoin overlay is already covering the screen — just swap, no extra sweep
    rejoining = false;
    screenLanding.classList.toggle('active', name === 'landing');
    screenGame.classList.toggle('active',   name === 'game');
    if (name === 'game') requestAnimationFrame(() => onResize());
    return;
  }
  const overlay = document.createElement('div');
  overlay.className = 'screen-transition';
  document.body.appendChild(overlay);
  // Force reflow then sweep in
  void overlay.offsetWidth;
  overlay.classList.add('sweep-in');
  setTimeout(() => {
    screenLanding.classList.toggle('active', name === 'landing');
    screenGame.classList.toggle('active',   name === 'game');
    overlay.classList.remove('sweep-in');
    overlay.classList.add('sweep-out');
    // Recalculate table sizes now that the game screen is visible
    if (name === 'game') requestAnimationFrame(() => onResize());
    setTimeout(() => overlay.remove(), 420);
  }, 360);
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Auth integration ────────────────────────────────────────────────────────
const authBarGuest = document.getElementById('auth-bar-guest');
const authBarUser  = document.getElementById('auth-bar-user');
const authBarName  = document.getElementById('auth-bar-name');

function updateAuthBar(user) {
  if (user) {
    authBarGuest?.classList.add('hidden');
    authBarUser?.classList.remove('hidden');
    const fullName = user.user_metadata?.full_name || user.email || '';
    const name = fullName.split(' ')[0];
    if (authBarName) authBarName.textContent = name;
    // Pre-fill name input on landing
    const inp = document.getElementById('inp-name');
    if (inp && !inp.value) inp.value = name.slice(0, 20);
    // Sync mobile header
    document.getElementById('mobile-auth-guest')?.classList.add('hidden');
    document.getElementById('mobile-auth-user')?.classList.remove('hidden');
    const mobileName = document.getElementById('mobile-auth-bar-name');
    if (mobileName) mobileName.textContent = name;
  } else {
    authBarGuest?.classList.remove('hidden');
    authBarUser?.classList.add('hidden');
    // Sync mobile header
    document.getElementById('mobile-auth-guest')?.classList.remove('hidden');
    document.getElementById('mobile-auth-user')?.classList.add('hidden');
  }
}

document.getElementById('btn-open-signin')?.addEventListener('click', () => Auth.openAuthModal('signin'));
document.getElementById('btn-open-signup')?.addEventListener('click', () => Auth.openAuthModal('signup'));
document.getElementById('btn-signout')?.addEventListener('click', async () => {
  document.getElementById('auth-loading-overlay')?.classList.remove('hidden');
  await Auth.signOut();
  document.getElementById('auth-loading-overlay')?.classList.add('hidden');
  showToast('Signed out', 'leave');
});

document.getElementById('mobile-btn-open-signin')?.addEventListener('click', () => Auth.openAuthModal('signin'));
document.getElementById('mobile-btn-open-signup')?.addEventListener('click', () => Auth.openAuthModal('signup'));
document.getElementById('mobile-btn-signout')?.addEventListener('click', async () => {
  document.getElementById('auth-loading-overlay')?.classList.remove('hidden');
  await Auth.signOut();
  document.getElementById('auth-loading-overlay')?.classList.add('hidden');
  showToast('Signed out', 'leave');
});

// Init auth modal and listen for auth state changes
Auth.initAuthModal();
let _authInitialized = false;
Auth.onAuthStateChange(async (user, event) => {
  updateAuthBar(user);

  if (user && event === 'SIGNED_IN' && _authInitialized) {
    const _firstName = (user.user_metadata?.full_name || user.email || '').split(' ')[0];
    showToast(`Welcome, ${escHtml(_firstName)}!`, 'join');

    // Load Jira connection from Supabase if not already linked
    if (!jiraSession) {
      const conn = await Auth.loadJiraConnection();
      if (conn) {
        jiraSession = conn.sessionId;
        jiraDomain  = conn.domain;
        localStorage.setItem('jiraSession', jiraSession);
        localStorage.setItem('jiraDomain',  jiraDomain);
        saveJiraTokenData({ accessToken: conn.accessToken, refreshToken: conn.refreshToken, expiresAt: conn.expiresAt, cloudId: conn.cloudId, domain: conn.domain });
        if (myRoom) socket.emit('link-jira-session', { jiraSessionId: jiraSession });
        updateJiraButton(true);
      }
    }
  }

  _authInitialized = true;
});
