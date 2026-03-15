'use strict';

// Shared in-memory state — imported by routes and socket handlers
const rooms = {};
const jiraSessions = {}; // sessionId → { accessToken, refreshToken, expiresAt, cloudId, domain }

module.exports = { rooms, jiraSessions };
