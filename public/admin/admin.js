'use strict';

const $ = id => document.getElementById(id);
let socket = null;

// ── Gate ──
function tryConnect(secret) {
  $('gate-error').textContent = '';
  socket = io('/admin', { auth: { token: secret } });

  socket.on('connect_error', () => {
    $('gate-error').textContent = 'Invalid secret.';
    socket.disconnect();
    socket = null;
    sessionStorage.removeItem('admin_token');
  });

  socket.on('connect', () => {
    sessionStorage.setItem('admin_token', secret);
    $('gate').style.display = 'none';
    $('dashboard').style.display = 'block';
  });

  socket.on('stats', render);
}

$('gate-btn').addEventListener('click', () => {
  const val = $('gate-input').value.trim();
  if (!val) { $('gate-error').textContent = 'Please enter the secret.'; return; }
  tryConnect(val);
});
$('gate-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('gate-btn').click(); });

// Auto-restore session
const saved = sessionStorage.getItem('admin_token');
if (saved) tryConnect(saved);

// ── Render ──
function render(d) {
  // Live
  $('s-rooms').textContent   = d.live.activeRooms;
  $('s-sockets').textContent = `${d.live.connectedSockets} connected socket${d.live.connectedSockets !== 1 ? 's' : ''}`;
  $('s-players').textContent = d.live.totalPlayers;
  $('s-peak').textContent    = `Peak: ${d.ai.peakPlayers}`;
  $('s-jira').textContent    = d.live.jiraConnections;
  $('s-rounds').textContent  = d.ai.roundsCompleted;

  // AI
  $('s-ai-total').textContent      = d.ai.estimatesTotal;
  $('s-ai-tokens').textContent     = d.ai.tokensTotal.toLocaleString();
  $('s-ai-tokens-sub').textContent = `${d.ai.tokensInput.toLocaleString()} in · ${d.ai.tokensOutput.toLocaleString()} out`;
  $('s-ai-insuf').textContent      = d.ai.estimatesInsufficient;
  $('s-ai-err').textContent        = d.ai.estimatesErrors;

  // Claude rate limits
  const rl = d.ai.rateLimits;
  const rlBody = $('claude-rl-body');
  if (rl) {
    const tPct = rl.tokensLimit > 0 ? Math.round((rl.tokensRemaining / rl.tokensLimit) * 100) : 0;
    const rPct = rl.requestsLimit > 0 ? Math.round((rl.requestsRemaining / rl.requestsLimit) * 100) : 0;
    const tColor = tPct < 20 ? 'red' : tPct < 50 ? 'amber' : '';
    const rColor = rPct < 20 ? 'red' : rPct < 50 ? 'amber' : '';
    if (rl.tokensReset) $('claude-rl-reset').textContent = `· resets ${new Date(rl.tokensReset).toLocaleTimeString()}`;
    rlBody.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:4px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
            <strong>Tokens remaining</strong>
            <span style="color:var(--muted)">${rl.tokensRemaining.toLocaleString()} / ${rl.tokensLimit.toLocaleString()}</span>
          </div>
          <div style="height:6px;background:rgba(8,17,46,0.08);border-radius:99px;overflow:hidden">
            <div style="height:100%;border-radius:99px;background:${tColor === 'red' ? 'var(--red)' : tColor === 'amber' ? 'var(--amber)' : 'var(--primary)'};width:${tPct}%;transition:width 0.5s"></div>
          </div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
            <strong>Requests remaining</strong>
            <span style="color:var(--muted)">${rl.requestsRemaining.toLocaleString()} / ${rl.requestsLimit.toLocaleString()}</span>
          </div>
          <div style="height:6px;background:rgba(8,17,46,0.08);border-radius:99px;overflow:hidden">
            <div style="height:100%;border-radius:99px;background:${rColor === 'red' ? 'var(--red)' : rColor === 'amber' ? 'var(--amber)' : 'var(--primary)'};width:${rPct}%;transition:width 0.5s"></div>
          </div>
        </div>
      </div>`;
  }

  // Server
  $('s-uptime').textContent = d.server.uptimeHuman;
  $('s-node').textContent   = `Node ${d.server.nodeVersion} · ${d.server.platform}`;
  $('dash-started').textContent = `Server started ${new Date(d.startedAt).toLocaleString()}`;

  const heapPct = Math.round((d.server.memHeapUsed / d.server.memHeapTotal) * 100);
  $('s-heap-label').textContent = `${d.server.memHeapUsed} / ${d.server.memHeapTotal} MB`;
  $('s-heap-bar').style.width   = heapPct + '%';
  $('s-heap-bar').className     = 'progress-fill' + (heapPct > 85 ? ' red' : heapPct > 65 ? ' amber' : '');

  const rssPct = Math.min(Math.round(d.server.memRss / 5), 100);
  $('s-rss-label').textContent = `${d.server.memRss} MB`;
  $('s-rss-bar').style.width   = rssPct + '%';

  const load    = parseFloat(d.server.loadAvg[0]);
  const loadPct = Math.min(Math.round(load * 25), 100);
  $('s-load-label').textContent = d.server.loadAvg.join(' · ');
  $('s-load-bar').style.width   = loadPct + '%';
  $('s-load-bar').className     = 'progress-fill' + (load > 3 ? ' red' : load > 1.5 ? ' amber' : '');

  // Rooms
  const rc = $('rooms-container');
  if (d.rooms.length === 0) {
    rc.innerHTML = '<div class="rooms-empty">No active rooms</div>';
  } else {
    rc.innerHTML = '<div class="room-list">' + d.rooms.map(r => `
      <div class="room-row">
        <div>
          <div class="room-code">${r.code}</div>
          <div class="room-meta">${r.playerCount} player${r.playerCount !== 1 ? 's' : ''} · ${r.issueCount} issue${r.issueCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="room-badges">
          ${r.revealed ? '<span class="badge badge-green">Revealed</span>' : '<span class="badge badge-blue">Voting</span>'}
          ${r.hasJira   ? '<span class="badge badge-blue">Jira</span>' : ''}
          ${r.devCount  ? `<span class="badge badge-gray">${r.devCount} Dev</span>` : ''}
          ${r.qaCount   ? `<span class="badge badge-amber">${r.qaCount} QA</span>` : ''}
          ${r.spectators ? `<span class="badge badge-gray">${r.spectators} 👁</span>` : ''}
        </div>
      </div>`).join('') + '</div>';
  }

  // Players
  const pc = $('players-container');
  const allPlayers = d.rooms.flatMap(r => r.players.map(p => ({ ...p, room: r.code })));
  if (allPlayers.length === 0) {
    pc.innerHTML = '<div class="rooms-empty">No players online</div>';
  } else {
    pc.innerHTML = '<div class="player-rows">' + allPlayers.map(p => `
      <div class="player-row">
        <div class="player-name">${esc(p.name)}${p.isAdmin ? ' 👑' : ''}${p.isSpectator ? ' 👁' : ''}</div>
        <span class="badge ${p.role === 'dev' ? 'badge-blue' : p.role === 'qa' ? 'badge-amber' : 'badge-gray'}">${p.role}</span>
        <span class="badge ${p.voted ? 'badge-green' : 'badge-gray'}">${p.voted ? 'Voted' : 'Waiting'}</span>
        <div class="player-room">${p.room}</div>
      </div>`).join('') + '</div>';
  }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
