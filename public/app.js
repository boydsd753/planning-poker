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
        valueEl.textContent = opt.dataset.label || opt.text;
        dropdown.querySelectorAll('.csel-option').forEach(o =>
          o.classList.toggle('selected', o.dataset.value === opt.value));
        closeDropdown();
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
function toggleValue(btn) {
  const on = btn.classList.toggle('active');
  btn.setAttribute('aria-pressed', String(on));
  return on;
}
[togAutoReveal, togShowAvg, togCountdown, togSpectator].forEach(btn => {
  btn.addEventListener('click', () => toggleValue(btn));
});

function getSettings() {
  return {
    gameName:     inpGameName.value.trim(),
    deck:         selDeck.value,
    whoCanReveal: selWhoReveal.value,
    autoReveal:   togAutoReveal.classList.contains('active'),
    showAverage:  togShowAvg.classList.contains('active'),
    countdown:    togCountdown.classList.contains('active'),
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
  prevPlayerIds = newIds;
  currentRoom = room;

  syncTimer(room.timer);

  if (justRevealed && room.settings?.countdown) {
    doCountdown(() => render(room, true));
  } else {
    render(room, justRevealed);
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
  socket.emit('create-room', { name, settings: getSettings(), role: selRole.value });
});

btnJoin.addEventListener('click', () => {
  const name = inpName.value.trim();
  const code = inpRoomCode.value.trim().toUpperCase();
  const isSpectator = togSpectator.classList.contains('active');
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  if (!code) { landingError.textContent = 'Please enter a room code.'; return; }
  landingError.textContent = '';
  if (!socket.connected) socket.connect();
  socket.emit('join-room', { name, roomCode: code, isSpectator, role: selRole.value });
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

// Issues sidebar
btnIssuesToggle.addEventListener('click', () => issuesSidebar.classList.toggle('open'));
btnSidebarClose.addEventListener('click', () => issuesSidebar.classList.remove('open'));

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
  if (timer.running) {
    timerDisplay.classList.add('running');
    btnTimerStart.classList.add('hidden');
    btnTimerPause.classList.remove('hidden');
    const tick = () => {
      const ms = (timer.elapsed || 0) + (Date.now() - timer.startedAt);
      timerDisplay.textContent = formatMs(ms);
    };
    tick();
    timerInterval = setInterval(tick, 500);
  } else {
    timerDisplay.classList.remove('running');
    btnTimerStart.classList.remove('hidden');
    btnTimerPause.classList.add('hidden');
    timerDisplay.textContent = formatMs(timer.elapsed || 0);
  }
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
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
function render(room, animateFlip = false) {
  const s       = room.settings || {};
  const players = Object.values(room.players);
  const me      = players.find(p => p.id === myId);
  const isAdmin = me?.isAdmin || false;
  const canAct  = isAdmin || s.whoCanReveal === 'all';

  gameNameDisplay.textContent = s.gameName || '';

  btnTransferHost.classList.toggle('hidden', !isAdmin);
  updateJiraButton(isAdmin);

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

  renderTableCenter(devPlayers, room.revealed, s, room, 'dev');
  renderTableCenter(qaPlayers,  room.revealed, s, room, 'qa');
  renderTeamPlayers(devPlayers, room.revealed, animateFlip, 'dev');
  renderTeamPlayers(qaPlayers,  room.revealed, animateFlip, 'qa');
  renderIssues(room.issues || [], room.activeIssueId);
  renderEstimatePanel(room, isAdmin);

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
  const cards = DECKS[deckKey] || DECKS.fibonacci;
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

function renderTeamPlayers(teamPlayers, revealed, animateFlip, team) {
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
    if (isSpec) { avatar.innerHTML = ICON_EYE; } else { avatar.textContent = getInitials(player.name); }
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
let jiraEst = { dev: '', qa: '', original: '' };
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

  // Reset estimates when active issue changes
  if (jiraEstIssueId !== activeIssue.id) {
    jiraEstIssueId = activeIssue.id;
    jiraEst = { dev: '', qa: '', original: '' };
  }

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
    li.className = 'issue-item' + (issue.id === activeId ? ' active' : '');

    let estHtml = '';
    if (issue.devEstimate || issue.qaEstimate) {
      const d = issue.devEstimate ? `<span class="issue-estimate dev-est">Dev: ${escHtml(issue.devEstimate)}</span>` : '';
      const q = issue.qaEstimate  ? `<span class="issue-estimate qa-est">QA: ${escHtml(issue.qaEstimate)}</span>` : '';
      estHtml = `<span class="issue-estimates">${d}${q}</span>`;
    }

    li.innerHTML = `
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
        e.preventDefault(); // prevent blur before click
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
  btnJiraFetch.disabled = false;
  btnJiraFetch.click();
}

inpJiraProject.addEventListener('focus', () => {
  if (allProjects.length) renderProjectDropdown(inpJiraProject.value);
});

inpJiraProject.addEventListener('input', () => {
  selectedProjectKey = '';
  stepFilter.classList.add('hidden');
  btnJiraFetch.disabled = true;
  jiraResults.classList.add('hidden');
  renderProjectDropdown(inpJiraProject.value);
});

inpJiraProject.addEventListener('blur', () => {
  setTimeout(() => projectDropdown.classList.add('hidden'), 150);
});

btnJiraImport.addEventListener('click', async () => {
  if (!jiraSession) { showToast('Link your Jira account first (top-right)', 'info'); return; }
  jiraResults.innerHTML = '';
  jiraResults.classList.add('hidden');
  stepFilter.classList.add('hidden');
  btnJiraFetch.disabled = true;
  allProjects = [];
  selectedProjectKey = '';
  inpJiraProject.value = '';
  inpJiraProject.placeholder = 'Loading projects…';
  inpJiraProject.disabled = true;
  projectDropdown.classList.add('hidden');
  jiraModal.classList.remove('hidden');

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

selJiraFilter.addEventListener('change', () => {
  if (selectedProjectKey) btnJiraFetch.click();
});

btnJiraCancel.addEventListener('click', () => jiraModal.classList.add('hidden'));
jiraModal.addEventListener('click', e => { if (e.target === jiraModal) jiraModal.classList.add('hidden'); });

// All fetched issues (for client-side search)
let allFetchedIssues = [];

btnJiraFetch.addEventListener('click', async () => {
  const projectKey = selectedProjectKey;
  if (!projectKey) return;
  btnJiraFetch.textContent = 'Fetching…';
  btnJiraFetch.disabled = true;
  jiraResults.innerHTML = '';
  jiraResults.classList.add('hidden');
  allFetchedIssues = [];

  const filter = selJiraFilter?.value || 'all';
  const issueUrl = `/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}&filter=${encodeURIComponent(filter)}`;

  try {
    const data = await jiraGet(issueUrl);
    allFetchedIssues = data.issues || [];
    renderIssueResults(allFetchedIssues);
  } catch (err) {
    jiraResults.innerHTML = `<p class="jira-error">${escHtml(err.message)}</p>`;
    jiraResults.classList.remove('hidden');
  } finally {
    btnJiraFetch.textContent = 'Fetch Issues';
    btnJiraFetch.disabled = false;
  }
});

function renderIssueResults(issues) {
  jiraResults.innerHTML = '';

  if (!issues.length && !allFetchedIssues.length) {
    jiraResults.innerHTML = '<p class="jira-empty">No issues found.</p>';
    jiraResults.classList.remove('hidden');
    return;
  }

  // Search input
  const searchWrap = document.createElement('div');
  searchWrap.className = 'jira-issue-search-wrap';
  const searchInp = document.createElement('input');
  searchInp.type = 'text';
  searchInp.className = 'jira-issue-search';
  searchInp.placeholder = 'Search issues…';
  searchInp.autocomplete = 'off';
  searchInp.addEventListener('input', () => {
    const q = searchInp.value.toLowerCase();
    const filtered = allFetchedIssues.filter(i =>
      i.key.toLowerCase().includes(q) || i.title.toLowerCase().includes(q) || i.status.toLowerCase().includes(q)
    );
    renderIssueList(ul, filtered);
    hint.textContent = buildHintText(filtered.length, allFetchedIssues.length);
  });
  searchWrap.appendChild(searchInp);

  const hint = document.createElement('p');
  hint.className = 'jira-hint';
  hint.textContent = buildHintText(issues.length, allFetchedIssues.length);

  const ul = document.createElement('ul');
  ul.className = 'jira-issue-list';
  renderIssueList(ul, issues);

  jiraResults.appendChild(searchWrap);
  jiraResults.appendChild(hint);
  jiraResults.appendChild(ul);
  jiraResults.classList.remove('hidden');

  searchInp.focus();
}

function buildHintText(shown, total) {
  if (shown === total) return `${total} issue${total !== 1 ? 's' : ''} — click to add`;
  return `${shown} of ${total} issues — click to add`;
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
    li.innerHTML = `
      <span class="jira-key">${escHtml(issue.key)}</span>
      <span class="jira-summary">${escHtml(issue.title.replace(issue.key + ': ', ''))}</span>
      <span class="jira-status">${escHtml(issue.status)}</span>`;
    li.addEventListener('click', () => {
      socket.emit('add-issue', { title: issue.title, jiraKey: issue.key });
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
  screenLanding.classList.toggle('active', name === 'landing');
  screenGame.classList.toggle('active',   name === 'game');
}

function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
