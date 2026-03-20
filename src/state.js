'use strict';

// Shared in-memory state — imported by routes and socket handlers
const rooms = {};
const jiraSessions = {}; // sessionId → { accessToken, refreshToken, expiresAt, cloudId, domain }

const stats = {
  startedAt: Date.now(),
  aiEstimatesTotal:        0,
  aiEstimatesInsufficient: 0,
  aiEstimatesErrors:       0,
  aiTokensInput:           0,
  aiTokensOutput:          0,
  aiRateLimits:            null, // updated after each Claude call
  roundsCompleted:         0,
  peakPlayers:             0,
};

module.exports = { rooms, jiraSessions, stats };
