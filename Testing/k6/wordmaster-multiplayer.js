import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const workflowCompletions = new Counter('workflow_completions');
const workflowFailures = new Rate('workflow_failures');
const createLobbyFailures = new Counter('create_lobby_failures');
const createLobbyStatus0 = new Counter('create_lobby_status_0');
const createLobbyStatus400 = new Counter('create_lobby_status_400');
const createLobbyStatus401 = new Counter('create_lobby_status_401');
const createLobbyStatus403 = new Counter('create_lobby_status_403');
const createLobbyStatus404 = new Counter('create_lobby_status_404');
const createLobbyStatus409 = new Counter('create_lobby_status_409');
const createLobbyStatus429 = new Counter('create_lobby_status_429');
const createLobbyStatus500 = new Counter('create_lobby_status_500');
const createLobbyStatus502 = new Counter('create_lobby_status_502');
const createLobbyStatus503 = new Counter('create_lobby_status_503');
const createLobbyStatus504 = new Counter('create_lobby_status_504');
const createLobbyStatusOther = new Counter('create_lobby_status_other');

const rawBaseUrl = __ENV.BASE_URL || 'http://127.0.0.1:5024';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = `${baseUrl}/api`;
const profile = (__ENV.TEST_PROFILE || 'load').toLowerCase();
const profiles = {
  smoke: {
    stages: [
      { duration: '10s', target: 1 },
      { duration: '20s', target: 2 },
      { duration: '10s', target: 0 },
    ],
    thresholds: {
      http_req_failed: ['rate<0.01'],
      http_req_duration: ['p(95)<1200', 'avg<700'],
      checks: ['rate>0.99'],
      workflow_failures: ['rate<0.02'],
    },
  },
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
    tags: {
      name: tags.endpoint,
      ...tags,
    },
  });
}

function safeJson(response) {
  try {
    return response.json();
  } catch {
    return null;
  }
}

function recordCreateLobbyFailureStatus(status) {
  switch (status) {
    case 0:
      createLobbyStatus0.add(1);
      break;
    case 400:
      createLobbyStatus400.add(1);
      break;
    case 401:
      createLobbyStatus401.add(1);
      break;
    case 403:
      createLobbyStatus403.add(1);
      break;
    case 404:
      createLobbyStatus404.add(1);
      break;
    case 409:
      createLobbyStatus409.add(1);
      break;
    case 429:
      createLobbyStatus429.add(1);
      break;
    case 500:
      createLobbyStatus500.add(1);
      break;
    case 502:
      createLobbyStatus502.add(1);
      break;
    case 503:
      createLobbyStatus503.add(1);
      break;
    case 504:
      createLobbyStatus504.add(1);
      break;
    default:
      createLobbyStatusOther.add(1);
      break;
  }
}

function createLobby() {
  const payload = { name: `host-${__VU}-${__ITER}-${Date.now()}` };
  const response = postJson(
    `${apiBaseUrl}/lobby`,
    payload,
    { endpoint: 'create_lobby' }
  );

  const ok = check(response, {
    'create lobby returned 200': (r) => r.status === 200,
    'create lobby returned ids': (r) => {
      if (r.status !== 200) {
        return false;
      }

      const body = safeJson(r);
      return !!body.lobbyId && !!body.playerId;
    },
  });

  if (!ok) {
    createLobbyFailures.add(1);
    recordCreateLobbyFailureStatus(response.status);
    return null;
  }

  const body = safeJson(response);
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

      return !!safeJson(r)?.player?.id;
    },
  });

  if (!ok) {
    return null;
  }

  return safeJson(response).player.id;
}

function readyPlayer(lobbyId, playerId, role) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/ready/${playerId}`,
    null,
    {
      tags: {
        name: 'ready_player',
        endpoint: 'ready_player',
        role,
      },
    }
  );

  return check(response, {
    [`${role} ready returned 200`]: (r) => r.status === 200,
  });
}

function startGame(lobbyId, hostId) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/start/${hostId}`,
    null,
    {
      tags: {
        name: 'start_game',
        endpoint: 'start_game',
      },
    }
  );

  return check(response, {
    'start game returned 200': (r) => r.status === 200,
  });
}

function leaveLobby(lobbyId, playerId, role) {
  const response = http.post(
    `${apiBaseUrl}/lobby/${lobbyId}/leave/${playerId}`,
    null,
    {
      tags: {
        name: 'leave_lobby',
        endpoint: 'leave_lobby',
        role,
      },
    }
  );

  return check(response, {
    [`${role} leave returned 200`]: (r) => r.status === 200,
  });
}

function getShopState(lobbyId, playerId, role) {
  const response = http.get(
    `${apiBaseUrl}/lobby/${lobbyId}/shop/${playerId}`,
    {
      tags: {
        name: 'shop_state',
        endpoint: 'shop_state',
        role,
      },
    }
  );

  const ok = check(response, {
    [`${role} shop state returned 200`]: (r) => r.status === 200,
    [`${role} shop state includes catalog`]: (r) => {
      if (r.status !== 200) {
        return false;
      }

      return Array.isArray(safeJson(r)?.state?.catalog);
    },
  });

  return ok ? safeJson(response)?.state : null;
}

function syncShopScore(lobbyId, playerId, role, earnedScore) {
  const response = postJson(
    `${apiBaseUrl}/lobby/${lobbyId}/shop/${playerId}/sync-score`,
    { earnedScore },
    {
      endpoint: 'shop_sync_score',
      role,
    }
  );

  const ok = check(response, {
    [`${role} shop score sync returned 200`]: (r) => r.status === 200,
    [`${role} shop balance reflects synced score`]: (r) => {
      if (r.status !== 200) {
        return false;
      }

      return safeJson(r)?.state?.earnedScore === earnedScore;
    },
  });

  return ok ? safeJson(response)?.state : null;
}

function purchaseShopItem(lobbyId, playerId, role, itemId) {
  const response = postJson(
    `${apiBaseUrl}/lobby/${lobbyId}/shop/${playerId}/purchase`,
    { itemId },
    {
      endpoint: 'shop_purchase',
      role,
      itemId,
    }
  );

  const ok = check(response, {
    [`${role} purchase ${itemId} returned 200`]: (r) => r.status === 200,
    [`${role} purchase ${itemId} returned item`]: (r) => {
      if (r.status !== 200) {
        return false;
      }

      return safeJson(r)?.item?.id?.toLowerCase() === itemId.toLowerCase();
    },
  });

  return ok ? safeJson(response)?.state : null;
}

function consumeShopPowerup(lobbyId, playerId, role, powerupId) {
  const response = postJson(
    `${apiBaseUrl}/lobby/${lobbyId}/shop/${playerId}/consume-powerup`,
    { powerupId },
    {
      endpoint: 'shop_consume_powerup',
      role,
      powerupId,
    }
  );

  return check(response, {
    [`${role} consume ${powerupId} returned 200`]: (r) => r.status === 200,
    [`${role} consume ${powerupId} clears owned count`]: (r) => {
      if (r.status !== 200) {
        return false;
      }

      return (safeJson(r)?.state?.powerups?.[powerupId] || 0) === 0;
    },
  });
}

export function setup() {
  const healthResponse = http.get(`${apiBaseUrl}/health`, {
    tags: {
      name: 'healthcheck',
      endpoint: 'healthcheck',
    },
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

    if (!getShopState(lobbyId, hostId, 'host')) {
      return;
    }

    if (!syncShopScore(lobbyId, hostId, 'host', 15)) {
      return;
    }

    if (!purchaseShopItem(lobbyId, hostId, 'host', 'A')) {
      return;
    }

    if (!purchaseShopItem(lobbyId, hostId, 'host', 'freeze')) {
      return;
    }

    if (!consumeShopPowerup(lobbyId, hostId, 'host', 'freeze')) {
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
