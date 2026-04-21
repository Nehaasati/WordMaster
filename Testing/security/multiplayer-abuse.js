import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rawBaseUrl = process.env.BASE_URL || 'http://127.0.0.1:5024';
const baseUrl = rawBaseUrl.replace(/\/+$/, '');
const apiBaseUrl = `${baseUrl}/api`;
const failOnFindings = `${process.env.FAIL_ON_FINDINGS || 'false'}`.toLowerCase() === 'true';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.join(scriptDir, 'results');
const jsonReportPath = path.join(resultsDir, 'multiplayer-abuse-report.json');
const markdownReportPath = path.join(resultsDir, 'multiplayer-abuse-report.md');

const findings = [];

function ensureResultsDir() {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

async function postEmpty(url) {
  const response = await fetch(url, { method: 'POST' });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

async function getJson(url) {
  const response = await fetch(url);

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return { response, body };
}

function addFinding(id, severity, title, endpoint, evidence) {
  findings.push({ id, severity, title, endpoint, evidence });
}

async function createLobby(hostName) {
  const { response, body } = await postJson(`${apiBaseUrl}/lobby`, { name: hostName });
  if (response.status !== 200 || !body?.lobbyId || !body?.playerId) {
    throw new Error(`Failed to create lobby for ${hostName}`);
  }

  return {
    lobbyId: body.lobbyId,
    hostId: body.playerId,
  };
}

async function joinLobby(lobbyId, guestName) {
  const { response, body } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/join`, {
    name: guestName,
    isHost: false,
    characterId: 'leopard',
  });

  if (response.status !== 200 || !body?.player?.id) {
    throw new Error(`Failed to join lobby ${lobbyId}`);
  }

  return body.player.id;
}

async function markReady(lobbyId, playerId) {
  return postEmpty(`${apiBaseUrl}/lobby/${lobbyId}/ready/${playerId}`);
}

async function getLobby(lobbyId) {
  return getJson(`${apiBaseUrl}/lobby/${lobbyId}`);
}

async function scenarioForgedReady() {
  const { lobbyId, hostId } = await createLobby(`host-ready-${Date.now()}`);
  await joinLobby(lobbyId, `guest-ready-${Date.now()}`);

  const { response } = await markReady(lobbyId, hostId);

  if (response.status === 200) {
    addFinding(
      'forged-ready-request',
      'high',
      'Unauthenticated client can mark another player as ready',
      `/api/lobby/${lobbyId}/ready/${hostId}`,
      `Request returned 200 without any proof of caller identity.`
    );
  }
}

async function scenarioForgedScoreSave() {
  const { lobbyId, hostId } = await createLobby(`host-score-${Date.now()}`);
  await joinLobby(lobbyId, `guest-score-${Date.now()}`);

  const { response } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/save-score/${hostId}`, {
    score: 9999,
  });

  const lobby = await getLobby(lobbyId);
  const host = lobby.body?.players?.find((player) => player.id === hostId);

  if (response.status === 200 && host?.score === 9999) {
    addFinding(
      'forged-score-save',
      'high',
      'Unauthenticated client can overwrite another player score',
      `/api/lobby/${lobbyId}/save-score/${hostId}`,
      `Score update succeeded and host score became ${host.score}.`
    );
  }
}

async function scenarioForcedLeave() {
  const { lobbyId } = await createLobby(`host-leave-${Date.now()}`);
  const guestId = await joinLobby(lobbyId, `guest-leave-${Date.now()}`);

  const { response } = await postEmpty(`${apiBaseUrl}/lobby/${lobbyId}/leave/${guestId}`);

  if (response.status === 200) {
    addFinding(
      'forced-leave',
      'high',
      'Unauthenticated client can remove another player from a lobby',
      `/api/lobby/${lobbyId}/leave/${guestId}`,
      `Leave request returned 200 without caller verification.`
    );
  }
}

async function scenarioHostActionSpoof() {
  const { lobbyId, hostId } = await createLobby(`host-start-${Date.now()}`);
  const guestId = await joinLobby(lobbyId, `guest-start-${Date.now()}`);

  await markReady(lobbyId, hostId);
  await markReady(lobbyId, guestId);

  const { response } = await postEmpty(`${apiBaseUrl}/lobby/${lobbyId}/start/${hostId}`);
  const lobby = await getLobby(lobbyId);

  if (response.status === 200 && lobby.body?.gameStarted === true) {
    addFinding(
      'host-action-spoof',
      'medium',
      'Game start can be triggered by anyone who knows the host playerId',
      `/api/lobby/${lobbyId}/start/${hostId}`,
      `Start request returned 200 and lobby entered started state without authenticating the caller.`
    );
  }
}

async function scenarioForgedShopScoreSync() {
  const { lobbyId, hostId } = await createLobby(`host-shop-score-${Date.now()}`);
  await joinLobby(lobbyId, `guest-shop-score-${Date.now()}`);

  const { response, body } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${hostId}/sync-score`, {
    earnedScore: 25,
  });

  if (response.status === 200 && body?.state?.earnedScore === 25) {
    addFinding(
      'forged-shop-score-sync',
      'high',
      'Unauthenticated client can sync another player shop score',
      `/api/lobby/${lobbyId}/shop/${hostId}/sync-score`,
      `Shop score sync succeeded and host earnedScore became ${body.state.earnedScore}.`
    );
  }
}

async function scenarioForgedShopPurchase() {
  const { lobbyId, hostId } = await createLobby(`host-shop-buy-${Date.now()}`);
  await joinLobby(lobbyId, `guest-shop-buy-${Date.now()}`);

  await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${hostId}/sync-score`, {
    earnedScore: 10,
  });

  const { response, body } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${hostId}/purchase`, {
    itemId: 'A',
  });

  if (response.status === 200 && body?.state?.purchasedLetters?.includes('A')) {
    addFinding(
      'forged-shop-purchase',
      'high',
      'Unauthenticated client can purchase shop items for another player',
      `/api/lobby/${lobbyId}/shop/${hostId}/purchase`,
      `Purchase succeeded and added letter A to the host shop state.`
    );
  }
}

async function scenarioForgedShopPowerupConsume() {
  const { lobbyId } = await createLobby(`host-shop-consume-${Date.now()}`);
  const guestId = await joinLobby(lobbyId, `guest-shop-consume-${Date.now()}`);

  await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${guestId}/sync-score`, {
    earnedScore: 10,
  });
  await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${guestId}/purchase`, {
    itemId: 'freeze',
  });

  const { response, body } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${guestId}/consume-powerup`, {
    powerupId: 'freeze',
  });

  if (response.status === 200 && (body?.state?.powerups?.freeze || 0) === 0) {
    addFinding(
      'forged-shop-powerup-consume',
      'high',
      'Unauthenticated client can consume another player power-up',
      `/api/lobby/${lobbyId}/shop/${guestId}/consume-powerup`,
      `Consume request succeeded and removed the guest freeze power-up.`
    );
  }
}

async function scenarioInvalidShopScoreRejected() {
  const { lobbyId, hostId } = await createLobby(`host-shop-invalid-${Date.now()}`);

  const { response, body } = await postJson(`${apiBaseUrl}/lobby/${lobbyId}/shop/${hostId}/sync-score`, {
    earnedScore: -1,
  });

  if (response.status < 400 || body?.state?.earnedScore < 0) {
    addFinding(
      'invalid-shop-score-accepted',
      'medium',
      'Shop accepts invalid negative earned score',
      `/api/lobby/${lobbyId}/shop/${hostId}/sync-score`,
      `Negative score sync returned ${response.status}.`
    );
  }
}

function writeReports() {
  ensureResultsDir();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    findingsCount: findings.length,
    findings,
  };

  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

  const lines = [
    '# Multiplayer Security Findings',
    '',
    `- Target: ${baseUrl}`,
    `- Findings: ${findings.length}`,
    '',
  ];

  if (findings.length === 0) {
    lines.push('No findings detected by the current multiplayer abuse checks.');
  } else {
    for (const finding of findings) {
      lines.push(`## ${finding.title}`);
      lines.push('');
      lines.push(`- Id: ${finding.id}`);
      lines.push(`- Severity: ${finding.severity}`);
      lines.push(`- Endpoint: \`${finding.endpoint}\``);
      lines.push(`- Evidence: ${finding.evidence}`);
      lines.push('');
    }
  }

  fs.writeFileSync(markdownReportPath, lines.join('\n'));
}

async function main() {
  try {
    const health = await getJson(`${apiBaseUrl}/health`);
    if (health.response.status !== 200) {
      throw new Error(`Healthcheck failed for ${apiBaseUrl}`);
    }

    await scenarioForgedReady();
    await scenarioForgedScoreSave();
    await scenarioForcedLeave();
    await scenarioHostActionSpoof();
    await scenarioForgedShopScoreSync();
    await scenarioForgedShopPurchase();
    await scenarioForgedShopPowerupConsume();
    await scenarioInvalidShopScoreRejected();
  } finally {
    writeReports();
  }

  if (findings.length > 0) {
    console.log(`Security findings detected: ${findings.length}`);
    if (failOnFindings) {
      process.exitCode = 1;
    }
  } else {
    console.log('No multiplayer security findings detected.');
  }
}

await main();
