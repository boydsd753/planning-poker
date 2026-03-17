'use strict';

const express = require('express');
const router  = express.Router();
const { jiraSessions } = require('../state');
const { httpRequest }  = require('../utils');

// OAuth — redirect to Atlassian login
router.get('/auth/jira', (req, res) => {
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  jiraSessions[`state_${state}`] = { expires: Date.now() + 5 * 60 * 1000 };
  const scopes = 'read:jira-work write:jira-work read:issue:jira write:issue:jira read:issue-details:jira offline_access';
  const redirectUri = `${process.env.APP_URL}/auth/jira/callback`;
  const url = `https://auth.atlassian.com/authorize?audience=api.atlassian.com`
    + `&client_id=${process.env.ATLASSIAN_CLIENT_ID}`
    + `&scope=${encodeURIComponent(scopes)}`
    + `&redirect_uri=${encodeURIComponent(redirectUri)}`
    + `&state=${state}&response_type=code&prompt=consent`;
  res.redirect(url);
});

// OAuth — Atlassian redirects back here with code
router.get('/auth/jira/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const stateKey = `state_${state}`;

  const fail = msg => res.send(`<script>window.opener?.postMessage({jiraError:${JSON.stringify(msg)}},location.origin);window.close();</script>`);

  if (error) return fail(error);
  if (!jiraSessions[stateKey] || jiraSessions[stateKey].expires < Date.now()) return fail('Invalid or expired state.');
  delete jiraSessions[stateKey];

  try {
    // Exchange code for access token
    const redirectUri = `${process.env.APP_URL}/auth/jira/callback`;
    const tokenRes = await httpRequest('auth.atlassian.com', null, 'POST', '/oauth/token', {
      grant_type: 'authorization_code',
      client_id: process.env.ATLASSIAN_CLIENT_ID,
      client_secret: process.env.ATLASSIAN_CLIENT_SECRET,
      code, redirect_uri: redirectUri,
    });
    if (tokenRes.status !== 200) {
      console.error('[jira oauth] token exchange failed:', tokenRes.status, tokenRes.body);
      return fail('Token exchange failed.');
    }
    const { access_token, refresh_token, expires_in } = JSON.parse(tokenRes.body);

    // Get their Jira cloud ID + domain
    const resourcesRes = await httpRequest('api.atlassian.com', `Bearer ${access_token}`, 'GET', '/oauth/token/accessible-resources', null);
    const resources = JSON.parse(resourcesRes.body);
    if (!resources.length) return fail('No Jira sites found for this account.');
    const { id: cloudId, url } = resources[0];
    const domain = url.replace('https://', '');
    // Decode JWT payload to log granted scopes
    try {
      const payload = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
      console.log(`[jira oauth] granted scopes:`, payload.scope || payload.scp || '(none found)');
    } catch {}
    console.log(`[jira oauth] cloudId=${cloudId} domain=${domain} token_length=${access_token?.length}`);

    // Store session
    const sessionId = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    jiraSessions[sessionId] = {
      accessToken:  access_token,
      refreshToken: refresh_token || null,
      expiresAt:    Date.now() + (expires_in || 3600) * 1000,
      cloudId,
      domain,
    };

    res.send(`<script>window.opener?.postMessage({jiraSession:${JSON.stringify(sessionId)},jiraDomain:${JSON.stringify(domain)}},location.origin);window.close();</script>`);
  } catch (err) {
    fail(err.message);
  }
});

module.exports = router;
