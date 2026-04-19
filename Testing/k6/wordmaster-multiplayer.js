import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const workflowCompletions = new Counter('workflow_completions');
const workflowFailures = new Rate('workflow_failures');

const rawBaseUrl = __ENV.BASE_URL || 'http://127.0.0.1:5024';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = `${baseUrl}/api`;
const profile = (__ENV.TEST_PROFILE || 'load').toLowerCase();

const profiles = {
  load: {
    stages: [
      { duration: '30s', target: 5 },
      { duration: '1m', target: 10 },
      { duration: '2m', target: 10 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.02'],
      http_req_duration: ['p(95)<1200', 'avg<700'],
      checks: ['rate>0.99'],
      workflow_failures: ['rate<0.05'],
    },
  },
  stress: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 20 },
      { duration: '2m', target: 30 },
      { duration: '1m', target: 40 },
      { duration: '30s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.05'],
      http_req_duration: ['p(95)<2500', 'avg<1200'],
      checks: ['rate>0.95'],
      workflow_failures: ['rate<0.10'],
    },
  },
};

const selectedProfile = profiles[profile] || profiles.load;

export const options = {
  stages: selectedProfile.stages,
  thresholds: selectedProfile.thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'max'],
};

function postJson(url, payload, tags) {
  return http.post(url, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json' },
    tags,
  });
}

function createLobby() {
  const hostName = `host-${__VU}-${__ITER}-${Date.now()}`;
  const response = postJson(
    `${apiBaseUrl}/lobby`,
    { name: hostName },
    { endpoint: 'create_lobby' }
  );

  const ok = check(response, {
    'create lobby returned 200': (r) => r.status === 200,
    'create lobby returned ids': (r) => {
      if (r.status !== 200) {
        return false;
      }

      const body = r.json();
      return !!body.lobbyId && !!body.playerId;
    },
  });

  if (!ok) {
    return null;
  }

  const body = response.json();
  return {
    lobbyId: body.lobbyId,
    hostId: body.playerId,
  };
}

function joinLobby(lobbyId) {
  const guestName = `guest-${__VU}-${__ITER}-${Date.now()}`;
  const response = postJson(
    `${apiBaseUrl}/lobby/${lobbyId}/join`,
    { name: guestName, isHost: false, characterId: 'leopard' },
    { endpoint: 'join_lobby' }
  );

  const ok = check(response, {
    'join lobby returned 200': (r) => r.status === 200,
    'join lobby returned player id': (r) => {
      if (r.status !== 200) {
        return false;
      }

      return !!r.json().player?.id;
    },
  });

  if (!ok) {
    return null;
  }

  return response.json().player.id;
}

function readyPlayer(lobbyId, playerId, role) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/ready/${playerId}`,
    null,
    { tags: { endpoint: 'ready_player', role } }
  );

  return check(response, {
    [`${role} ready returned 200`]: (r) => r.status === 200,
  });
}

function startGame(lobbyId, hostId) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/start/${hostId}`,
    null,
    { tags: { endpoint: 'start_game' } }
  );

  return check(response, {
    'start game returned 200': (r) => r.status === 200,
  });
}

function leaveLobby(lobbyId, playerId, role) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/leave/${playerId}`,
    null,
    { tags: { endpoint: 'leave_lobby', role } }
  );

  return check(response, {
    [`${role} leave returned 200`]: (r) => r.status === 200,
  });
}

export function setup() {
  const healthResponse = http.get(`${apiBaseUrl}/health`, {
    tags: { endpoint: 'healthcheck' },
  });

  const ok = check(healthResponse, {
    'health endpoint reachable': (r) => r.status === 200,
  });

  if (!ok) {
    throw new Error(`Healthcheck failed for ${apiBaseUrl}`);
  }

  return { profile, baseUrl };
}

export default function () {
  let workflowPassed = false;
  let lobbyId = null;
  let hostId = null;
  let guestId = null;

  try {
    const lobby = createLobby();
    if (!lobby) {
      return;
    }

    lobbyId = lobby.lobbyId;
    hostId = lobby.hostId;

    guestId = joinLobby(lobbyId);
    if (!guestId) {
      return;
    }

    if (!readyPlayer(lobbyId, hostId, 'host')) {
      return;
    }

    if (!readyPlayer(lobbyId, guestId, 'guest')) {
      return;
    }

    if (!startGame(lobbyId, hostId)) {
      return;
    }

    workflowPassed = true;
    workflowCompletions.add(1);
  } finally {
    workflowFailures.add(workflowPassed ? 0 : 1);

    if (lobbyId && guestId) {
      leaveLobby(lobbyId, guestId, 'guest');
    }

    if (lobbyId && hostId) {
      leaveLobby(lobbyId, hostId, 'host');
    }

    sleep(profile === 'stress' ? 0.2 : 0.5);
  }
}
