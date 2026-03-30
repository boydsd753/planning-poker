'use strict';

const supabase  = require('./supabase');
const { rooms, sessions } = require('./state');

const ROOM_TTL_HOURS = 48;

// ── Debounced room saves (2s per room) ────────────────────────────────────────
const saveTimers = {};

function scheduleSave(roomCode) {
  if (saveTimers[roomCode]) clearTimeout(saveTimers[roomCode]);
  saveTimers[roomCode] = setTimeout(() => {
    delete saveTimers[roomCode];
    const room = rooms[roomCode];
    if (room) _saveRoom(roomCode, room).catch(e => console.error('[db] scheduleSave error:', e.message));
  }, 2000);
}

async function _saveRoom(roomCode, room) {
  // Don't persist jiraSessionId — it's in-memory only, rebuilt by client on reconnect
  const state = { ...room, jiraSessionId: null };
  const { error } = await supabase
    .from('pp_rooms')
    .upsert({ code: roomCode, state, updated_at: new Date().toISOString() }, { onConflict: 'code' });
  if (error) console.error('[db] saveRoom error:', error.message);
}

// Immediate (non-debounced) room save — use before saveSession to satisfy FK constraint
async function saveRoomNow(roomCode, room) {
  await _saveRoom(roomCode, room);
}

// ── Sessions ──────────────────────────────────────────────────────────────────
async function saveSession(token, roomCode, playerData) {
  // Don't persist the avatar (large base64) — it's re-sent on every join
  const slim = { ...playerData, avatar: null };
  const { error } = await supabase
    .from('pp_sessions')
    .upsert({ token, room_code: roomCode, player_data: slim, updated_at: new Date().toISOString() }, { onConflict: 'token' });
  if (error) console.error('[db] saveSession error:', error.message);
}

async function deleteSession(token) {
  const { error } = await supabase.from('pp_sessions').delete().eq('token', token);
  if (error) console.error('[db] deleteSession error:', error.message);
}

async function deleteRoom(roomCode) {
  if (saveTimers[roomCode]) { clearTimeout(saveTimers[roomCode]); delete saveTimers[roomCode]; }
  const { error } = await supabase.from('pp_rooms').delete().eq('code', roomCode);
  if (error) console.error('[db] deleteRoom error:', error.message);
}

// ── Load on startup ───────────────────────────────────────────────────────────
async function loadAll() {
  const cutoff = new Date(Date.now() - ROOM_TTL_HOURS * 3600 * 1000).toISOString();

  const { data: roomRows, error: roomErr } = await supabase
    .from('pp_rooms')
    .select('code, state')
    .gte('updated_at', cutoff);

  if (roomErr) { console.error('[db] loadRooms error:', roomErr.message); return; }

  const loadedCodes = [];
  for (const row of (roomRows || [])) {
    // Clear players — all socket connections are dead after restart.
    // Players will auto-rejoin via their sessionToken and repopulate the room.
    row.state.players = {};
    row.state.jiraSessionId = null;
    // Pause any running timer — it can't continue after a restart
    if (row.state.timer?.running) {
      row.state.timer.running = false;
      row.state.timer.startedAt = null;
    }
    rooms[row.code] = row.state;
    loadedCodes.push(row.code);
  }

  if (loadedCodes.length === 0) {
    console.log('[db] no active rooms to restore');
    return;
  }

  const { data: sessionRows, error: sessErr } = await supabase
    .from('pp_sessions')
    .select('token, room_code, player_data')
    .in('room_code', loadedCodes);

  if (sessErr) { console.error('[db] loadSessions error:', sessErr.message); return; }

  for (const row of (sessionRows || [])) {
    sessions[row.token] = { roomCode: row.room_code, playerData: row.player_data };
  }

  console.log(`[db] restored ${loadedCodes.length} room(s), ${(sessionRows || []).length} session(s)`);
}

module.exports = { scheduleSave, saveRoomNow, saveSession, deleteSession, deleteRoom, loadAll };
