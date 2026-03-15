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
  return val === '☕' ? ICON_BREAK : escHtml(val);
}

// ── Custom dropdowns & segmented controls ────────────────────────────────
const ICON_CHECK   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>`;

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
[togAutoReveal, togShowAvg, togCountdown, togSpectator, $('tog-timer-auto-reveal')].filter(Boolean).forEach(btn => {
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
socket.on('connect', () => { myId = socket.id; });

socket.on('room-joined', ({ roomCode }) => {
  myRoom = roomCode;
  roomCodeDisplay.textContent = roomCode;
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

  if (justRevealed && room.settings?.countdown) {
    doCountdown(() => render(room, true, prevPlayerIdsSnap));
  } else {
    render(room, justRevealed, prevPlayerIdsSnap);
  }
});

socket.on('error-msg', (msg) => { landingError.textContent = msg; });

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
  socket.emit('create-room', { name, settings: getSettings(), role: selRole.value, avatar: myAvatar });
});

btnJoin.addEventListener('click', () => {
  const name = inpName.value.trim();
  const code = inpRoomCode.value.trim().toUpperCase();
  const isSpectator = togSpectator.classList.contains('active');
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  if (!code) { landingError.textContent = 'Please enter a room code.'; return; }
  landingError.textContent = '';
  if (!socket.connected) socket.connect();
  socket.emit('join-room', { name, roomCode: code, isSpectator, role: selRole.value, avatar: myAvatar });
});

inpName.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const tab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (tab === 'create') btnCreate.click(); else btnJoin.click();
});
inpRoomCode.addEventListener('keydown', e => { if (e.key === 'Enter') btnJoin.click(); });

// Game actions
$('btn-home').addEventListener('click', () => {
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
  prevVotedIds = incomingVotedIds; // update after render so next call can diff
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
  [['dev', devArea, devPokerTable], ['qa', qaArea, qaPokerTable]].forEach(([team, area, table]) => {
    const aw = area.offsetWidth;
    const ah = area.offsetHeight;
    const mobile = aw < 500;
    const tw = Math.min(aw * (mobile ? 0.42 : 0.58), 380);
    const th = Math.min(ah * (mobile ? 0.62 : 0.90), 700);
    table.style.width  = `${tw}px`;
    table.style.height = `${th}px`;

    // Scale dealer proportionally — 1.0 at max table width (380px), shrinks below that
    const ds = Math.max(0.3, tw / 380);
    const dealer      = $(`${team}-dealer`);
    const dealerHands = $(`${team}-dealer-hands`);
    const dt = `translate(-50%, -68%) scale(${ds})`;
    if (dealer)      dealer.style.transform      = dt;
    if (dealerHands) dealerHands.style.transform = dt;
  });
}

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
  // On mobile: tighter radii + shift center down so players don't clip at top
  const rx = Math.min(aw * (isMobile ? 0.28 : 0.36), 210);
  const ry = Math.min(ah * (isMobile ? 0.30 : 0.45), 300);
  const cy = ah / 2 + (isMobile ? ah * 0.06 : 0);

  // Put "me" near the middle of the arc (bottom position)
  const myIdx = teamPlayers.findIndex(p => p.id === myId);
  let ordered = [...teamPlayers];
  if (myIdx >= 0) {
    const mid = Math.floor((teamPlayers.length - 1) / 2);
    ordered.splice(myIdx, 1);
    ordered.splice(mid, 0, teamPlayers[myIdx]);
  }

  const N = ordered.length;
  // Scale seats proportional to table width (same formula as dealer)
  const tw = Math.min(aw * 0.58, 380);
  const sizeScale = Math.max(0.3, tw / 380);
  const crowdScale = N <= 9 ? 1.0 : Math.max(0.55, 1.0 - (N - 9) * 0.05);
  const scale = sizeScale * crowdScale;

  ordered.forEach((player, i) => {
    const angle = teamAngle(i, N);
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const isMe    = player.id === myId;
    const hasVoted = player.card !== null;
    const isSpec  = player.isSpectator;

    const seat = document.createElement('div');
    seat.className  = 'player-seat';
    seat.style.left = `${x}px`;
    seat.style.top  = `${y}px`;
    seat.style.transform = `translate(-50%, -50%) scale(${scale})`;

    const wrap  = document.createElement('div');
    wrap.className = 'player-card-wrap';
    const inner = document.createElement('div');
    inner.className = 'player-card-inner';
    if (revealed && hasVoted && !isSpec && !animateFlip) inner.classList.add('flipped');

    const back = document.createElement('div');
    back.className = (!isSpec && hasVoted) ? 'card-face card-back' : 'card-face card-empty';
    if (isSpec) back.innerHTML = ICON_EYE;
    else if (!hasVoted) back.textContent = '·';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    if (revealed && hasVoted && !isSpec) {
      const v = player.card;
      front.innerHTML = `<span class="cv-center">${cardDisplay(v)}</span>`;
    }

    inner.appendChild(back);
    inner.appendChild(front);
    wrap.appendChild(inner);

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar' +
      (isMe ? ' is-me' : '') +
      (player.isAdmin ? ' is-admin' : '') +
      (isSpec ? ' is-spectator' : '');
    if (isSpec) {
      avatar.innerHTML = ICON_EYE;
    } else if (player.avatar) {
      const avatarImg = document.createElement('img');
      avatarImg.src = player.avatar;
      avatarImg.alt = player.name;
      avatar.appendChild(avatarImg);
    } else {
      avatar.textContent = getInitials(player.name);
    }
    avatar.title = (player.isAdmin ? '(host) ' : '') + player.name;

    const nameEl = document.createElement('div');
    nameEl.className = 'player-name' + (isMe ? ' is-me' : '') + (isSpec ? ' is-spectator' : '');
    nameEl.innerHTML = isMe
      ? `${escHtml(player.name)} (You)`
      : escHtml(player.name) + (player.isAdmin ? ` ${ICON_STAR}` : '') + (isSpec ? ` ${ICON_EYE}` : '');

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

    if (animateFlip && revealed && hasVoted && !isSpec) {
      setTimeout(() => inner.classList.add('flipped'), i * 140);
    }
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

  if (!revealed) {
    const activeIssue = room.issues?.find(i => i.id === room.activeIssueId);
    const voted  = voters.filter(p => p.card !== null).length;
    const status = `${voted} / ${voters.length} voted`;

    if (activeIssue) {
      el.innerHTML = `
        <div class="table-issue-pill">
          <div class="table-issue-label">Voting on</div>
          <div class="table-issue-title">${escHtml(activeIssue.title)}</div>
          <div class="table-issue-status">${status}</div>
        </div>`;
    } else {
      el.innerHTML = `<span class="table-waiting">${status}</span>`;
    }
    return;
  }

  const voted = voters.filter(p => p.card !== null);
  const numericVotes = voted
    .map(p => p.card === '½' ? 0.5 : Number(p.card))
    .filter(n => !isNaN(n));

  if (numericVotes.length === 0) {
    el.innerHTML = `<div class="stats-wrap"><span class="stat-range">No numeric votes</span></div>`;
    return;
  }

  const allCards = voted.map(p => p.card);
  const allSame  = allCards.length > 0 && allCards.every(c => c === allCards[0]);

  if (allSame) {
    el.innerHTML = `
      <div class="stats-wrap">
        <span class="stat-consensus">${ICON_SPARKLES} Consensus!</span>
        <span class="stat-avg">${cardDisplay(allCards[0])}</span>
        <span class="stat-label">Everyone agreed</span>
      </div>`;
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
    <div class="stats-wrap">
      ${avgHtml}
      <span class="stat-range">Range: ${min} – ${max}</span>
    </div>`;
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
    .map(p => p.card === '½' ? 0.5 : Number(p.card))
    .filter(n => !isNaN(n));

  let statsHtml = '';
  let saveHtml  = '';

  if (numericVotes.length > 0) {
    const allCards = voters.map(p => p.card);
    const allSame  = allCards.every(c => c === allCards[0]);
    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    const min = Math.min(...numericVotes);
    const max = Math.max(...numericVotes);
    const avgStr = avg % 1 === 0 ? String(avg) : avg.toFixed(1);

    if (allSame) {
      statsHtml = `<div class="results-stats"><span class="results-consensus">${ICON_SPARKLES} Consensus! — ${cardDisplay(allCards[0])}</span></div>`;
    } else {
      const avgPart = settings?.showAverage !== false ? `<span class="results-avg">Avg: ${avgStr}</span>` : '';
      statsHtml = `<div class="results-stats">${avgPart}<span class="results-range">Range: ${min} – ${max}</span></div>`;
    }

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
          <div class="vote-card-mini${isWinner ? ' highlight' : ''}">${cardDisplay(val)}</div>
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
const jiraEstMap = {}; // issueId → { dev, qa, original }
let jiraEstIssueId = null;

function getTopVote(teamPlayers) {
  const voters = teamPlayers.filter(p => !p.isSpectator && p.card !== null);
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

  jiraEstIssueId = activeIssue.id;
  if (!jiraEstMap[activeIssue.id]) {
    jiraEstMap[activeIssue.id] = {
      dev:      activeIssue.devEstimate      || '',
      qa:       activeIssue.qaEstimate       || '',
      original: activeIssue.originalEstimate || '',
    };
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
  }

  jiraEstimatePanel.classList.remove('hidden');
  jiraEstimatePanel.innerHTML = `
    <div class="jira-est-header">
      <span class="jira-est-key">${escHtml(activeIssue.jiraKey)}</span>
      <span class="jira-est-title">Estimates</span>
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

  // Keep local state in sync as user edits
  ['dev','qa','original'].forEach(key => {
    const el = $(`est-${key}`);
    if (el) el.addEventListener('input', () => { jiraEst[key] = el.value; });
  });

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

    li.innerHTML = `
      ${savedBadge}
      <span class="issue-title">${escHtml(issue.title)}</span>
      ${estHtml}
      <button class="issue-delete" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="13" height="13"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/></svg></button>`;
    li.querySelector('.issue-title').addEventListener('click', () => {
      socket.emit('set-active-issue', { id: issue.id });
    });
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

function jiraHeaders() {
  return { 'Content-Type': 'application/json', 'x-jira-session': jiraSession || '' };
}

function updateJiraButton(isAdmin) {
  const label = jiraSession ? `Jira: ${jiraDomain}` : 'Link Jira';
  if (!isAdmin) {
    btnLinkJira.classList.add('hidden');
    btnLinkJiraMobile.classList.add('hidden');
    return;
  }
  btnLinkJira.classList.remove('hidden');
  btnLinkJira.textContent = label;
  btnLinkJira.classList.toggle('jira-linked', !!jiraSession);
  btnLinkJiraMobile.classList.remove('hidden');
  btnLinkJiraMobile.textContent = label;
  btnLinkJiraMobile.classList.toggle('jira-linked', !!jiraSession);
}

btnLinkJira.addEventListener('click', () => {
  if (jiraSession) {
    // Already linked — click to unlink
    jiraSession = null; jiraDomain = null;
    localStorage.removeItem('jiraSession');
    localStorage.removeItem('jiraDomain');
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
      updateJiraButton(true);
      showToast(`Jira linked: ${escHtml(jiraDomain)}`, 'join');
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

async function jiraGet(url) {
  const res = await fetch(url, { headers: { 'x-jira-session': jiraSession || '' }, cache: 'no-store' });
  const data = await res.json();
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
  if (!jiraSession) { showToast('Link your Jira account first (top-right)', 'info'); return; }
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
  jiraResults.innerHTML = '<p class="jira-fetching">Fetching issues…</p>';
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
