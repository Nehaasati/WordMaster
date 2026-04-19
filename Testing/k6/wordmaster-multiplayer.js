import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const workflowCompletions = new Counter('workflow_completions');
const workflowFailures = new Rate('workflow_failures');
const createLobbyFailures = new Counter('create_lobby_failures');
const createLobbyFailureStatus = new Counter('create_lobby_failure_status');

const rawBaseUrl = __ENV.BASE_URL || 'http://127.0.0.1:5024';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = `${baseUrl}/api`;
const profile = (__ENV.TEST_PROFILE || 'load').toLowerCase();
const debugFailures = `${__ENV.DEBUG_FAILURES || 'true'}`.toLowerCase() === 'true';
const maxFailureSamples = Number.parseInt(__ENV.MAX_FAILURE_SAMPLES || '8', 10);
const failureSamples = [];

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
    tags: {
      name: tags.endpoint,
      ...tags,
    },
  });
}

function truncate(value, maxLength = 250) {
  if (!value) {
    return '';
  }

  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function recordFailureSample(type, response, payload) {
  if (!debugFailures || failureSamples.length >= maxFailureSamples) {
    return;
  }

  failureSamples.push({
    type,
    status: response.status,
    body: truncate(response.body || ''),
    payload,
  });
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

      const body = r.json();
      return !!body.lobbyId && !!body.playerId;
    },
  });

  if (!ok) {
    createLobbyFailures.add(1);
    createLobbyFailureStatus.add(1, { status: String(response.status) });
    recordFailureSample('create_lobby', response, payload);
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

export function handleSummary(data) {
  const iterations = data.metrics.iterations?.values?.count ?? 0;
  const httpFailureRate = data.metrics.http_req_failed?.values?.rate ?? 0;
  const workflowFailureRate = data.metrics.workflow_failures?.values?.rate ?? 0;
  const lobbyFailureCount = data.metrics.create_lobby_failures?.values?.count ?? 0;

  const lines = [
    '# k6 Summary',
    '',
    `- Target: ${baseUrl}`,
    `- Profile: ${profile}`,
    `- Iterations: ${iterations}`,
    `- HTTP failure rate: ${httpFailureRate}`,
    `- Workflow failure rate: ${workflowFailureRate}`,
    `- Create lobby failures: ${lobbyFailureCount}`,
    '',
  ];

  if (failureSamples.length > 0) {
    lines.push('## Failure samples', '');
    for (const sample of failureSamples) {
      lines.push(`- Type: ${sample.type}`);
      lines.push(`- Status: ${sample.status}`);
      lines.push(`- Payload: ${JSON.stringify(sample.payload)}`);
      lines.push(`- Body: ${sample.body || '<empty>'}`);
      lines.push('');
    }
  }

  return {
    stdout: `${lines.join('\n')}\n`,
  };
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
