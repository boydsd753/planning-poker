'use strict';

// ── Supabase Auth Client ────────────────────────────────────────────────────
const { createClient } = supabase;
const _sb = createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseKey);

let _currentUser = null;
let _onAuthChange = null;

// Called by app.js to react to sign-in/out
function onAuthStateChange(cb) {
  _onAuthChange = cb;
  _sb.auth.onAuthStateChange((event, session) => {
    _currentUser = session?.user || null;
    cb(_currentUser, event);
  });
}

function getUser() { return _currentUser; }

async function signUp(email, password, nickname) {
  const { data, error } = await _sb.auth.signUp({
    email, password,
    options: { data: { full_name: nickname } },
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await _sb.auth.signOut();
  if (error) throw error;
}

async function signInWithOAuth(provider) {
  const { error } = await _sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: location.origin },
  });
  if (error) throw error;
}

async function resetPassword(email) {
  const { error } = await _sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${location.origin}/?reset=1`,
  });
  if (error) throw error;
}

async function getSession() {
  const { data } = await _sb.auth.getSession();
  return data.session;
}

// Save Jira tokens to Supabase for logged-in users
async function saveJiraConnection(sessionId, accessToken, refreshToken, expiresAt, cloudId, domain) {
  if (!_currentUser) return;
  await _sb.from('jira_connections').upsert({
    user_id:       _currentUser.id,
    session_id:    sessionId,
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    expiresAt,
    cloud_id:      cloudId,
    domain,
    updated_at:    new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

// Load Jira tokens from Supabase for logged-in users
async function loadJiraConnection() {
  if (!_currentUser) return null;
  const { data, error } = await _sb.from('jira_connections')
    .select('*')
    .eq('user_id', _currentUser.id)
    .single();
  if (error || !data) return null;
  return {
    sessionId:    data.session_id,
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    data.expires_at,
    cloudId:      data.cloud_id,
    domain:       data.domain,
  };
}

// Update stored Jira tokens (after server refreshes them)
async function updateJiraTokens(accessToken, refreshToken, expiresAt) {
  if (!_currentUser) return;
  await _sb.from('jira_connections').update({
    access_token:  accessToken,
    refresh_token: refreshToken,
    expires_at:    expiresAt,
    updated_at:    new Date().toISOString(),
  }).eq('user_id', _currentUser.id);
}

// ── Auth Loading Overlay ─────────────────────────────────────────────────────
function showAuthLoading() {
  document.getElementById('auth-loading-overlay')?.classList.remove('hidden');
}
function hideAuthLoading() {
  document.getElementById('auth-loading-overlay')?.classList.add('hidden');
}

// ── Auth Modal UI ───────────────────────────────────────────────────────────
function openAuthModal(defaultTab = 'signin') {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('hidden');
  switchAuthTab(defaultTab);
  // Focus first input
  setTimeout(() => {
    const first = modal.querySelector(`#auth-tab-${defaultTab} input`);
    if (first) first.focus();
  }, 80);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
  clearAuthErrors();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`auth-tab-${tab}`)?.classList.remove('hidden');
  document.querySelector(`.auth-tab-btn[data-tab="${tab}"]`)?.classList.add('active');
}

function setAuthError(tab, msg) {
  const el = document.getElementById(`auth-error-${tab}`);
  if (el) el.textContent = msg;
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error').forEach(el => el.textContent = '');
}

function setAuthLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

function initAuthModal() {
  // Tab switching
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
  });

  // Close
  document.getElementById('btn-auth-close')?.addEventListener('click', closeAuthModal);
  document.getElementById('auth-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('auth-modal')) closeAuthModal();
  });

  // OAuth buttons
  document.querySelectorAll('.btn-oauth').forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      btn.disabled = true;
      try {
        showAuthLoading();
        await signInWithOAuth(provider);
        closeAuthModal();
      } catch (err) {
        hideAuthLoading();
        const tab = btn.closest('.auth-tab-panel')?.id?.replace('auth-tab-', '') || 'signin';
        setAuthError(tab, err.message);
        btn.disabled = false;
      }
    });
  });

  // Sign In
  document.getElementById('btn-signin')?.addEventListener('click', async () => {
    const email    = document.getElementById('auth-email-signin').value.trim();
    const password = document.getElementById('auth-password-signin').value;
    if (!email || !password) return setAuthError('signin', 'Please fill in all fields.');
    setAuthLoading('btn-signin', true);
    try {
      showAuthLoading();
      await signIn(email, password);
      closeAuthModal();
    } catch (err) {
      setAuthError('signin', err.message);
    } finally {
      hideAuthLoading();
      setAuthLoading('btn-signin', false);
    }
  });

  // Enter key on sign in
  ['auth-email-signin', 'auth-password-signin'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-signin')?.click();
    });
  });

  // Sign Up
  document.getElementById('btn-signup')?.addEventListener('click', async () => {
    const nickname = document.getElementById('auth-nickname').value.trim();
    const email    = document.getElementById('auth-email-signup').value.trim();
    const password = document.getElementById('auth-password-signup').value;
    if (!nickname) return setAuthError('signup', 'Please enter your name.');
    if (!email)    return setAuthError('signup', 'Please enter your email.');
    if (password.length < 8) return setAuthError('signup', 'Password must be at least 8 characters.');
    setAuthLoading('btn-signup', true);
    try {
      await signUp(email, password, nickname);
      // Show confirmation message
      document.getElementById('auth-tab-signup').innerHTML = `
        <div class="auth-confirm">
          <div class="auth-confirm-icon">✉</div>
          <p class="auth-confirm-title">Check your email</p>
          <p class="auth-confirm-hint">We sent a confirmation link to <strong>${email}</strong>. Click it to activate your account.</p>
        </div>`;
    } catch (err) {
      setAuthError('signup', err.message);
    } finally {
      setAuthLoading('btn-signup', false);
    }
  });

  // Enter key on sign up
  ['auth-nickname', 'auth-email-signup', 'auth-password-signup'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-signup')?.click();
    });
  });

  // Forgot password link
  document.getElementById('btn-forgot')?.addEventListener('click', () => switchAuthTab('forgot'));
  document.getElementById('btn-back-signin')?.addEventListener('click', () => switchAuthTab('signin'));

  // Reset password
  document.getElementById('btn-reset')?.addEventListener('click', async () => {
    const email = document.getElementById('auth-email-forgot').value.trim();
    if (!email) return setAuthError('forgot', 'Please enter your email.');
    setAuthLoading('btn-reset', true);
    try {
      await resetPassword(email);
      document.getElementById('auth-tab-forgot').innerHTML = `
        <div class="auth-confirm">
          <div class="auth-confirm-icon">✉</div>
          <p class="auth-confirm-title">Reset email sent</p>
          <p class="auth-confirm-hint">Check your inbox for a password reset link.</p>
        </div>`;
    } catch (err) {
      setAuthError('forgot', err.message);
    } finally {
      setAuthLoading('btn-reset', false);
    }
  });

  // Enter key on forgot
  document.getElementById('auth-email-forgot')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('btn-reset')?.click();
  });
}

window.Auth = {
  onAuthStateChange,
  getUser,
  getSession,
  signUp,
  signIn,
  signOut,
  signInWithOAuth,
  resetPassword,
  openAuthModal,
  closeAuthModal,
  saveJiraConnection,
  loadJiraConnection,
  updateJiraTokens,
  initAuthModal,
};
