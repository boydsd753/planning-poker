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
  if (me?.isAdmin && !wasAdmin && currentRoom) showToast('You are now the host ★', 'host');
  wasAdmin = me?.isAdmin || false;

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
  socket.emit('create-room', { name, settings: getSettings(), role: selRole.value });
});

btnJoin.addEventListener('click', () => {
  const name = inpName.value.trim();
  const code = inpRoomCode.value.trim().toUpperCase();
  const isSpectator = togSpectator.classList.contains('active');
  if (!name) { landingError.textContent = 'Please enter your name.'; return; }
  if (!code) { landingError.textContent = 'Please enter a room code.'; return; }
  landingError.textContent = '';
  socket.emit('join-room', { name, roomCode: code, isSpectator, role: selRole.value });
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

btnTransferHost.addEventListener('click', () => {
  if (!currentRoom) return;
  const players = Object.values(currentRoom.players).filter(p => p.id !== myId);
  transferList.innerHTML = '';
  players.forEach(p => {
    const li = document.createElement('li');
    li.className = 'transfer-item';
    li.innerHTML = `<div class="transfer-item-avatar">${getInitials(p.name)}</div><span>${p.name}${p.isSpectator ? ' 👁' : ''} <small style="color:var(--muted)">(${p.role})</small></span>`;
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
    const tw = Math.min(aw * 0.58, 380);
    const th = Math.min(ah * 0.90, 700);
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
    btn.textContent = val;
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
  const cy = ah / 2;
  const rx = Math.min(aw * 0.36, 210);
  const ry = Math.min(ah * 0.45, 300);

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
    if (isSpec) back.textContent = '👁';
    else if (!hasVoted) back.textContent = '·';

    const front = document.createElement('div');
    front.className = 'card-face card-front';
    if (revealed && hasVoted && !isSpec) {
      const v = player.card;
      front.innerHTML = `<span class="cv-center">${v}</span>`;
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
        <div class="table-lonely-emoji">👤</div>
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
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,0.6)">Voting on</div>
          <div style="font-size:11px;line-height:1.4;color:white">${escHtml(activeIssue.title)}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px">${status}</div>
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

  el.innerHTML = `
    <div class="stats-wrap">
      ${avgHtml}
      <span class="stat-range">Range: ${min} – ${max}</span>
    </div>`;
}

function renderResults(players, settings, room) {
  const devPlayers = players.filter(p => p.role === 'dev');
  const qaPlayers  = players.filter(p => p.role === 'qa');

  const devHtml = buildTeamResults(devPlayers, settings, room, 'dev', '👨‍💻 Dev Team');
  const qaHtml  = buildTeamResults(qaPlayers,  settings, room, 'qa',  '🧪 QA Team');

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
      statsHtml = `<div class="results-stats"><span class="results-consensus">🎉 Consensus! — ${allCards[0]}</span></div>`;
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
          <div class="vote-card-mini${isWinner ? ' highlight' : ''}">${val}</div>
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
        showToast(`Saved estimates to ${activeIssue.jiraKey}`, 'join');
        setTimeout(() => { if (saveBtn) { saveBtn.textContent = 'Save to Jira'; saveBtn.disabled = false; } }, 2500);
      } catch (err) {
        showToast(`Save failed: ${err.message}`, 'leave');
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

// ── Jira OAuth session ─────────────────────────────────────────────────────
let jiraSession = sessionStorage.getItem('jiraSession') || null;
let jiraDomain  = sessionStorage.getItem('jiraDomain')  || null;

function jiraHeaders() {
  return { 'Content-Type': 'application/json', 'x-jira-session': jiraSession || '' };
}

function updateJiraButton(isAdmin) {
  if (!isAdmin) { btnLinkJira.classList.add('hidden'); return; }
  btnLinkJira.classList.remove('hidden');
  btnLinkJira.textContent = jiraSession ? `Jira: ${jiraDomain}` : 'Link Jira';
  btnLinkJira.classList.toggle('jira-linked', !!jiraSession);
}

btnLinkJira.addEventListener('click', () => {
  if (jiraSession) {
    // Already linked — click to unlink
    jiraSession = null; jiraDomain = null;
    sessionStorage.removeItem('jiraSession');
    sessionStorage.removeItem('jiraDomain');
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
      sessionStorage.setItem('jiraSession', jiraSession);
      sessionStorage.setItem('jiraDomain',  jiraDomain);
      updateJiraButton(true);
      showToast(`Jira linked: ${jiraDomain}`, 'join');
    } else if (e.data.jiraError) {
      showToast(`Jira error: ${e.data.jiraError}`, 'leave');
    }
    window.removeEventListener('message', onMsg);
  };
  window.addEventListener('message', onMsg);
});

// ── Jira Import ────────────────────────────────────────────────────────────
const jiraModal        = $('jira-modal');
const btnJiraImport    = $('btn-jira-import');
const btnJiraCancel    = $('btn-jira-cancel');
const btnJiraFetch     = $('btn-jira-fetch');
const jiraResults      = $('jira-results');
const selJiraBoard  = $('sel-jira-board');
const selJiraSprint = $('sel-jira-sprint');
const stepSprint    = $('jira-step-sprint');

async function jiraGet(url) {
  const res = await fetch(url, { headers: { 'x-jira-session': jiraSession || '' } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

btnJiraImport.addEventListener('click', async () => {
  if (!jiraSession) { showToast('Link your Jira account first (top-right)', 'info'); return; }
  jiraResults.innerHTML = '';
  jiraResults.classList.add('hidden');
  stepSprint.classList.add('hidden');
  btnJiraFetch.disabled = true;
  selJiraBoard.innerHTML = '<option>Loading boards…</option>';
  selJiraBoard.disabled = true;
  jiraModal.classList.remove('hidden');

  try {
    const { boards } = await jiraGet('/api/jira/boards');
    selJiraBoard.innerHTML = '<option value="">Select a board…</option>';
    boards.forEach(b => {
      const opt = document.createElement('option');
      opt.dataset.projectKey = b.projectKey || '';
      opt.value = b.id;
      opt.textContent = b.project ? `${b.project} — ${b.name}` : b.name;
      selJiraBoard.appendChild(opt);
    });
    selJiraBoard.disabled = false;
  } catch (err) {
    selJiraBoard.innerHTML = `<option>Error: ${escHtml(err.message)}</option>`;
  }
});

selJiraBoard.addEventListener('change', async () => {
  const boardId = selJiraBoard.value;
  stepSprint.classList.add('hidden');
  btnJiraFetch.disabled = true;
  if (!boardId) return;

  stepSprint.classList.remove('hidden');
  selJiraSprint.innerHTML = '<option>Loading…</option>';
  selJiraSprint.disabled = true;

  try {
    const data = await jiraGet(`/api/jira/sprints?boardId=${encodeURIComponent(boardId)}`);
    selJiraSprint.innerHTML = '';
    const selectedOpt = selJiraBoard.options[selJiraBoard.selectedIndex];
    const projectKey = selectedOpt?.dataset.projectKey || '';
    const backlog = document.createElement('option');
    backlog.value = `__backlog__:${projectKey}`;
    backlog.textContent = 'Backlog';
    selJiraSprint.appendChild(backlog);
    if (!data.kanban && data.sprints?.length) {
      data.sprints.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} [${s.state}]`;
        selJiraSprint.appendChild(opt);
      });
    }
    selJiraSprint.disabled = false;
    btnJiraFetch.disabled = false;
  } catch (err) {
    selJiraSprint.innerHTML = `<option>Error: ${escHtml(err.message)}</option>`;
  }
});

btnJiraCancel.addEventListener('click', () => jiraModal.classList.add('hidden'));
jiraModal.addEventListener('click', e => { if (e.target === jiraModal) jiraModal.classList.add('hidden'); });

btnJiraFetch.addEventListener('click', async () => {
  const sprintVal = selJiraSprint.value;
  if (!sprintVal) return;
  btnJiraFetch.textContent = 'Fetching…';
  btnJiraFetch.disabled = true;
  jiraResults.innerHTML = '';
  jiraResults.classList.add('hidden');

  const isBacklog  = sprintVal.startsWith('__backlog__:');
  const projectKey = isBacklog ? sprintVal.split(':')[1] : null;
  const sprintId   = isBacklog ? null : sprintVal;
  const issueUrl   = isBacklog
    ? `/api/jira/issues?projectKey=${encodeURIComponent(projectKey)}`
    : `/api/jira/issues?sprintId=${encodeURIComponent(sprintId)}`;

  try {
    const data = await jiraGet(issueUrl);

    if (!data.issues.length) {
      jiraResults.innerHTML = '<p class="jira-empty">No issues found in this sprint.</p>';
      jiraResults.classList.remove('hidden');
      return;
    }

    const hint = document.createElement('p');
    hint.className = 'jira-hint';
    hint.textContent = `${data.issues.length} issue${data.issues.length !== 1 ? 's' : ''} — click to add`;

    const ul = document.createElement('ul');
    ul.className = 'jira-issue-list';

    data.issues.forEach(issue => {
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
        showToast(`Added: ${issue.key}`, 'info');
      });
      ul.appendChild(li);
    });

    jiraResults.appendChild(hint);
    jiraResults.appendChild(ul);
    jiraResults.classList.remove('hidden');
  } catch (err) {
    jiraResults.innerHTML = `<p class="jira-error">${escHtml(err.message)}</p>`;
    jiraResults.classList.remove('hidden');
  } finally {
    btnJiraFetch.textContent = 'Fetch Issues';
    btnJiraFetch.disabled = false;
  }
});

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
