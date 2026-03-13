'use strict';

const DECKS = {
  fibonacci:  ['0', '½', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
  modified:   ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕'],
  tshirt:     ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
  powers2:    ['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕'],
  sequential: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕'],
};

const $ = id => document.getElementById(id);

// DOM
const screenLanding    = $('screen-landing');
const screenGame       = $('screen-game');
const inpName          = $('inp-name');
const inpRoomCode      = $('inp-room-code');
const inpGameName      = $('inp-game-name');
const selDeck          = $('sel-deck');
const selWhoReveal     = $('sel-who-reveal');
const togAutoReveal    = $('tog-auto-reveal');
const togShowAvg       = $('tog-show-avg');
const togCountdown     = $('tog-countdown');
const togSpectator     = $('tog-spectator');
const btnCreate        = $('btn-create');
const btnJoin          = $('btn-join');
const btnCopyLink      = $('btn-copy-link');
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
const tableCenterEl    = $('table-center-content');
const playersLayer     = $('players-layer');
const cardsRow         = $('cards-row');
const landingError     = $('landing-error');
const tableArea        = $('table-area');
const pokerTable       = $('poker-table');
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

  // Toast notifications for join/leave
  const newIds = Object.keys(room.players);
  if (currentRoom) {
    const oldIds = prevPlayerIds;
    newIds.filter(id => !oldIds.includes(id) && id !== myId).forEach(id => {
      showToast(`${room.players[id]?.name || 'Someone'} joined`, 'join');
    });
    oldIds.filter(id => !newIds.includes(id)).forEach(id => {
      const name = currentRoom.players[id]?.name || 'Someone';
      showToast(`${name} left`, 'leave');
    });
  }
  prevPlayerIds = newIds;
  currentRoom = room;

  // Update timer display
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
  socket.emit('create-room', { name, settings: getSettings() });
});

btnJoin.addEventListener('click', () => {
  const name = inpName.value.trim();
  const code = inpRoomCode.value.trim().toUpperCase();
  const isSpectator = togSpectator.classList.contains('active');
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  if (!code) { landingError.textContent = 'Please enter a room code.'; return; }
  landingError.textContent = '';
  socket.emit('join-room', { name, roomCode: code, isSpectator });
});

inpName.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const tab = document.querySelector('.tab-btn.active')?.dataset.tab;
  if (tab === 'create') btnCreate.click(); else btnJoin.click();
});
inpRoomCode.addEventListener('keydown', e => { if (e.key === 'Enter') btnJoin.click(); });

// Game actions
btnCopyLink.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('room', myRoom);
  navigator.clipboard.writeText(url.toString()).then(() => {
    btnCopyLink.textContent = 'Copied!';
    btnCopyLink.classList.add('copied');
    setTimeout(() => { btnCopyLink.textContent = 'Copy Link'; btnCopyLink.classList.remove('copied'); }, 2000);
  });
});

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

// Resize
window.addEventListener('resize', () => {
  if (currentRoom) { sizeTable(); renderPlayers(Object.values(currentRoom.players), currentRoom.revealed); }
});

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
  t.textContent = msg;
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

  if (canAct) {
    btnReveal.classList.toggle('hidden', room.revealed);
    btnNewRound.classList.toggle('hidden', !room.revealed);
  } else {
    btnReveal.classList.add('hidden');
    btnNewRound.classList.add('hidden');
  }

  const voters = players.filter(p => !p.isSpectator);
  const voted  = voters.filter(p => p.card !== null).length;
  voteTally.textContent = room.revealed
    ? 'Cards revealed'
    : voters.length ? `${voted} / ${voters.length} voted` : '';

  sizeTable();
  renderTableCenter(players, room.revealed, s, room);
  renderPlayers(players, room.revealed, animateFlip);
  renderIssues(room.issues || [], room.activeIssueId);

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

function sizeTable() {
  const aw = tableArea.offsetWidth;
  const ah = tableArea.offsetHeight;
  pokerTable.style.width  = `${Math.min(aw * 0.60, 580)}px`;
  pokerTable.style.height = `${Math.min(ah * 0.55, 320)}px`;
}

function renderCardPicker(revealed, me, deckKey) {
  const cards = DECKS[deckKey] || DECKS.fibonacci;
  cardsRow.innerHTML = '';
  cards.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'pick-card';
    btn.textContent = val;
    if (me?.card === val) btn.classList.add('selected');
    if (revealed) btn.disabled = true;
    btn.addEventListener('click', () => { if (!revealed) socket.emit('select-card', { card: val }); });
    cardsRow.appendChild(btn);
  });
}

function renderPlayers(players, revealed, animateFlip = false) {
  playersLayer.innerHTML = '';
  if (!players.length) return;

  const aw = tableArea.offsetWidth;
  const ah = tableArea.offsetHeight;
  const cx = aw / 2, cy = ah / 2;
  const rx = Math.min(aw * 0.43, 310);
  const ry = Math.min(ah * 0.43, 195);

  const myIdx  = players.findIndex(p => p.id === myId);
  const rotated = myIdx >= 0 ? [...players.slice(myIdx), ...players.slice(0, myIdx)] : players;

  rotated.forEach((player, i) => {
    const angle = Math.PI / 2 + (i / rotated.length) * 2 * Math.PI;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    const isMe = player.id === myId;
    const hasVoted = player.card !== null;
    const isSpec = player.isSpectator;

    const seat = document.createElement('div');
    seat.className  = 'player-seat';
    seat.style.left = `${x}px`;
    seat.style.top  = `${y}px`;

    // Card (spectators get empty always)
    const wrap  = document.createElement('div');
    wrap.className = 'player-card-wrap';
    const inner = document.createElement('div');
    inner.className = 'player-card-inner';
    // When animating a fresh reveal, DON'T add flipped yet — we'll stagger it below
    if (revealed && hasVoted && !isSpec && !animateFlip) inner.classList.add('flipped');

    const back = document.createElement('div');
    back.className = (!isSpec && hasVoted) ? 'card-face card-back' : 'card-face card-empty';
    if (isSpec) back.textContent = '👁';
    else if (!hasVoted) back.textContent = '·';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    if (revealed && hasVoted && !isSpec) {
      const v = player.card;
      front.innerHTML = `<span class="cv-corner">${v}</span><span class="cv-center">${v}</span><span class="cv-corner-bot">${v}</span>`;
    }

    inner.appendChild(back);
    inner.appendChild(front);
    wrap.appendChild(inner);

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar' +
      (isMe ? ' is-me' : '') +
      (player.isAdmin ? ' is-admin' : '') +
      (isSpec ? ' is-spectator' : '');
    avatar.textContent = isSpec ? '👁' : getInitials(player.name);
    avatar.title = (player.isAdmin ? '(host) ' : '') + player.name;

    const nameEl = document.createElement('div');
    nameEl.className = 'player-name' + (isMe ? ' is-me' : '') + (isSpec ? ' is-spectator' : '');
    nameEl.textContent = isMe
      ? `${player.name} (You)`
      : player.name + (player.isAdmin ? ' ★' : '') + (isSpec ? ' 👁' : '');

    seat.appendChild(wrap);
    seat.appendChild(avatar);
    seat.appendChild(nameEl);
    playersLayer.appendChild(seat);

    // Staggered flip: trigger AFTER element is in DOM so the CSS transition fires
    if (animateFlip && revealed && hasVoted && !isSpec) {
      setTimeout(() => inner.classList.add('flipped'), i * 140);
    }
  });
}

function renderTableCenter(players, revealed, settings, room) {
  const voters = players.filter(p => !p.isSpectator);

  if (!revealed) {
    if (voters.length <= 1) {
      tableCenterEl.innerHTML = `
        <div class="table-lonely">
          <div class="table-lonely-emoji">😴</div>
          <div class="table-lonely-text">Feeling lonely?</div>
          <div class="table-lonely-hint">Share the link to invite your team</div>
        </div>`;
      return;
    }

    // Show active issue title if one is set
    const activeIssue = room.issues?.find(i => i.id === room.activeIssueId);
    const voted  = voters.filter(p => p.card !== null).length;
    const status = `${voted} / ${voters.length} voted`;

    if (activeIssue) {
      tableCenterEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;opacity:.5">Voting on</div>
          <div style="font-size:12px;line-height:1.4;opacity:.9">${escHtml(activeIssue.title)}</div>
          <div style="font-size:11px;opacity:.5;margin-top:2px">${status}</div>
        </div>`;
    } else {
      tableCenterEl.innerHTML = `<span class="table-waiting">${status}</span>`;
    }
    return;
  }

  const voted = voters.filter(p => p.card !== null);
  const numericVotes = voted
    .map(p => p.card === '½' ? 0.5 : Number(p.card))
    .filter(n => !isNaN(n));

  if (numericVotes.length === 0) {
    tableCenterEl.innerHTML = `<div class="stats-wrap"><span class="stat-range">No numeric votes</span></div>`;
    return;
  }

  const allCards = voted.map(p => p.card);
  const allSame  = allCards.length > 0 && allCards.every(c => c === allCards[0]);

  if (allSame) {
    tableCenterEl.innerHTML = `
      <div class="stats-wrap">
        <span class="stat-consensus">🎉 Consensus!</span>
        <span class="stat-avg">${allCards[0]}</span>
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

  tableCenterEl.innerHTML = `
    <div class="stats-wrap">
      ${avgHtml}
      <span class="stat-range">Range: ${min} – ${max}</span>
    </div>`;
}

function renderResults(players, settings, room) {
  const voters   = players.filter(p => !p.isSpectator && p.card !== null);
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
      statsHtml = `<div class="results-stats"><span class="results-consensus">🎉 Consensus! — ${allCards[0]}</span></div>`;
    } else {
      const avgPart = settings?.showAverage !== false ? `<span class="results-avg">Avg: ${avgStr}</span>` : '';
      statsHtml = `<div class="results-stats">${avgPart}<span class="results-range">Range: ${min} – ${max}</span></div>`;
    }

    // Save to active issue
    const activeIssue = room.issues?.find(i => i.id === room.activeIssueId);
    if (activeIssue) {
      const estimateVal = allSame ? allCards[0] : avgStr;
      if (activeIssue.estimate) {
        saveHtml = `<div class="results-save-row"><span class="save-confirm">✓ Saved as ${activeIssue.estimate}</span></div>`;
      } else {
        saveHtml = `
          <div class="results-save-row">
            <button class="btn-save-estimate" data-id="${activeIssue.id}" data-est="${estimateVal}">
              Save ${estimateVal} to "${escHtml(activeIssue.title.slice(0, 30))}${activeIssue.title.length > 30 ? '…' : ''}"
            </button>
          </div>`;
      }
    }
  }

  // Group votes by value
  const groups = {};
  voters.forEach(p => {
    if (!groups[p.card]) groups[p.card] = [];
    groups[p.card].push(p.name);
  });

  const votesHtml = Object.entries(groups)
    .sort(([a], [b]) => {
      const na = a === '½' ? 0.5 : Number(a);
      const nb = b === '½' ? 0.5 : Number(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return 0;
    })
    .map(([val, names], _, arr) => {
      const isWinner = arr.length > 1 && names.length === Math.max(...arr.map(([, n]) => n.length));
      return `
        <div class="vote-group">
          <div class="vote-card-mini${isWinner ? ' highlight' : ''}">${val}</div>
          <div class="vote-names" title="${names.join(', ')}">${names.join(', ')}</div>
        </div>`;
    }).join('');

  resultsContent.innerHTML = `
    ${statsHtml}
    <div class="results-votes">${votesHtml}</div>
    ${saveHtml}`;

  // Wire save button
  resultsContent.querySelectorAll('.btn-save-estimate').forEach(btn => {
    btn.addEventListener('click', () => {
      socket.emit('save-issue-estimate', { id: btn.dataset.id, estimate: btn.dataset.est });
    });
  });
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
    li.innerHTML = `
      <span class="issue-title">${escHtml(issue.title)}</span>
      ${issue.estimate ? `<span class="issue-estimate">${escHtml(issue.estimate)}</span>` : ''}
      <button class="issue-delete" title="Delete">✕</button>`;
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
