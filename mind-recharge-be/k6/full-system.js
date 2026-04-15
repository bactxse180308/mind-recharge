import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';

/*
  Functional end-to-end test for major backend modules.

  Recommended setup:
    1. Insert the 20 test users from k6/insert_20_test_accounts.sql
    2. Ensure backend is running
    3. Run:
       k6 run .\k6\full-system.js

  Default execution is intentionally low concurrency because this script
  mutates state across many modules.

  Important env vars:
    BASE_URL=http://localhost:8080
    K6_PASSWORD=User@123456
    K6_SECURITY_PASSWORD=1234
    K6_USE_ACCOUNT_POOL=true
    K6_ACCOUNT_PREFIX=loadtest
    K6_ACCOUNT_DOMAIN=mindrecharge.com
    K6_ACCOUNT_START=1
    K6_ACCOUNT_COUNT=20

    K6_FULL_VUS=1
    K6_FULL_ITERATIONS=1
    K6_FULL_DURATION=30s

    K6_FULL_ENABLE_SOCIAL=true
    K6_FULL_ENABLE_SUPPORT_CHAT=true
    K6_FULL_ENABLE_UNSENT=true
    K6_FULL_ENABLE_NO_CONTACT=true
    K6_FULL_ENABLE_TRIGGER=true

    K6_CHAT_PARTNER_EMAIL=
    K6_CHAT_PARTNER_PASSWORD=
*/

function parseEnvFile(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadRepoEnv() {
  const candidates = ['../.env', '.env'];

  for (const path of candidates) {
    try {
      return parseEnvFile(open(path));
    } catch (error) {
      // Ignore and continue.
    }
  }

  return {};
}

const FILE_ENV = loadRepoEnv();

function envValue(key, fallback) {
  if (__ENV[key] !== undefined && __ENV[key] !== '') {
    return __ENV[key];
  }

  if (FILE_ENV[key] !== undefined && FILE_ENV[key] !== '') {
    return FILE_ENV[key];
  }

  return fallback;
}

const BASE_URL = envValue('BASE_URL', 'http://localhost:8080').replace(/\/$/, '');
const PASSWORD = envValue('K6_PASSWORD', 'User@123456');
const SECURITY_PASSWORD = envValue('K6_SECURITY_PASSWORD', '1234');
const USE_ACCOUNT_POOL = String(envValue('K6_USE_ACCOUNT_POOL', 'true')).toLowerCase() === 'true';
const ACCOUNT_PREFIX = envValue('K6_ACCOUNT_PREFIX', 'loadtest');
const ACCOUNT_DOMAIN = envValue('K6_ACCOUNT_DOMAIN', 'mindrecharge.com');
const ACCOUNT_START = Number(envValue('K6_ACCOUNT_START', '1'));
const ACCOUNT_COUNT = Number(envValue('K6_ACCOUNT_COUNT', '20'));
const DEVICE_NAME = envValue('K6_DEVICE_NAME', 'k6-full-system');
const CHAT_PARTNER_EMAIL = envValue('K6_CHAT_PARTNER_EMAIL', '');
const CHAT_PARTNER_PASSWORD = envValue('K6_CHAT_PARTNER_PASSWORD', PASSWORD);

const ENABLE_SOCIAL = String(envValue('K6_FULL_ENABLE_SOCIAL', 'true')).toLowerCase() === 'true';
const ENABLE_SUPPORT_CHAT = String(envValue('K6_FULL_ENABLE_SUPPORT_CHAT', 'true')).toLowerCase() === 'true';
const ENABLE_UNSENT = String(envValue('K6_FULL_ENABLE_UNSENT', 'true')).toLowerCase() === 'true';
const ENABLE_NO_CONTACT = String(envValue('K6_FULL_ENABLE_NO_CONTACT', 'true')).toLowerCase() === 'true';
const ENABLE_TRIGGER = String(envValue('K6_FULL_ENABLE_TRIGGER', 'true')).toLowerCase() === 'true';
const THINK_TIME = Number(envValue('K6_FULL_SLEEP_SECONDS', '0.2'));

const FULL_DURATION = envValue('K6_FULL_DURATION', '');
const executionConfig = FULL_DURATION
  ? { duration: FULL_DURATION }
  : { iterations: Number(envValue('K6_FULL_ITERATIONS', '1')) };

export const options = {
  vus: Number(envValue('K6_FULL_VUS', '1')),
  ...executionConfig,
};

const expected200or404 = http.expectedStatuses(200, 404);
const expected200or400 = http.expectedStatuses(200, 400);
const expected201or409 = http.expectedStatuses(201, 409);

function jsonHeaders(extraHeaders) {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
}

function authHeaders(accessToken, extraHeaders) {
  return jsonHeaders({
    Authorization: `Bearer ${accessToken}`,
    ...extraHeaders,
  });
}

function safeJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function failResponse(name, response) {
  fail(`${name} failed. status=${response.status} body=${response.body}`);
}

function assertJsonSuccess(name, response, allowedStatuses) {
  const body = safeJson(response);
  const passed = check(response, {
    [`${name} status`]: (res) => allowedStatuses.includes(res.status),
    [`${name} success`]: () => body !== null && body.success === true,
  });

  if (!passed) {
    failResponse(name, response);
  }

  return body;
}

function assertStatus(name, response, allowedStatuses) {
  const passed = check(response, {
    [`${name} status`]: (res) => allowedStatuses.includes(res.status),
  });

  if (!passed) {
    failResponse(name, response);
  }
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function normalizeAccountNumber(offset) {
  return ACCOUNT_START + (offset % ACCOUNT_COUNT);
}

function accountEmail(accountNumber) {
  return `${ACCOUNT_PREFIX}${pad2(accountNumber)}@${ACCOUNT_DOMAIN}`;
}

function resolvePrimaryCredentials() {
  if (USE_ACCOUNT_POOL) {
    const zeroBasedVu = Math.max(__VU - 1, 0);
    const accountNumber = normalizeAccountNumber(zeroBasedVu * (ENABLE_SOCIAL ? 2 : 1));
    return {
      email: accountEmail(accountNumber),
      password: PASSWORD,
      label: `primary-${accountNumber}`,
    };
  }

  return {
    email: envValue('K6_EMAIL', ''),
    password: PASSWORD,
    label: 'primary-explicit',
  };
}

function resolvePartnerCredentials() {
  if (!ENABLE_SOCIAL) {
    return null;
  }

  if (USE_ACCOUNT_POOL) {
    if (ACCOUNT_COUNT < 2) {
      fail('K6_ACCOUNT_COUNT must be at least 2 when K6_FULL_ENABLE_SOCIAL=true.');
    }

    const zeroBasedVu = Math.max(__VU - 1, 0);
    const partnerNumber = normalizeAccountNumber(zeroBasedVu * 2 + 1);
    return {
      email: accountEmail(partnerNumber),
      password: PASSWORD,
      label: `partner-${partnerNumber}`,
    };
  }

  if (!CHAT_PARTNER_EMAIL || !CHAT_PARTNER_PASSWORD) {
    fail('Social flow requires K6_CHAT_PARTNER_EMAIL and K6_CHAT_PARTNER_PASSWORD when account pool is disabled.');
  }

  return {
    email: CHAT_PARTNER_EMAIL,
    password: CHAT_PARTNER_PASSWORD,
    label: 'partner-explicit',
  };
}

function login(credentials) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      deviceName: `${DEVICE_NAME}-${credentials.label}-vu-${__VU}`,
    }),
    jsonHeaders()
  );

  const body = assertJsonSuccess(`auth.login.${credentials.label}`, response, [200]);
  return {
    accessToken: body.data.accessToken,
    refreshToken: body.data.refreshToken,
    userId: body.data.userId,
    email: body.data.email,
    displayName: body.data.displayName,
  };
}

function refreshAuth(session, label) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/refresh`,
    JSON.stringify({ refreshToken: session.refreshToken }),
    jsonHeaders()
  );

  const body = assertJsonSuccess(`auth.refresh.${label}`, response, [200]);
  session.accessToken = body.data.accessToken;
  session.refreshToken = body.data.refreshToken;
}

function logout(accessToken, label) {
  const response = http.post(
    `${BASE_URL}/api/v1/auth/logout`,
    null,
    authHeaders(accessToken)
  );
  const body = safeJson(response);
  const passed = check(response, {
    [`auth.logout.${label} status`]: (res) => res.status >= 200 && res.status < 300,
    [`auth.logout.${label} success`]: () => body !== null && body.success === true,
  });

  if (!passed) {
    failResponse(`auth.logout.${label}`, response);
  }
}

function getMe(accessToken, label) {
  const response = http.get(`${BASE_URL}/api/v1/users/me`, authHeaders(accessToken));
  const body = assertJsonSuccess(`users.me.${label}`, response, [200]);
  return body.data;
}

function updateMe(accessToken, profile, label) {
  const response = http.patch(
    `${BASE_URL}/api/v1/users/me`,
    JSON.stringify({
      displayName: profile.displayName,
      timezone: profile.timezone,
      locale: profile.locale,
      avatarUrl: profile.avatarUrl,
      avatarKey: profile.avatarKey,
    }),
    authHeaders(accessToken)
  );
  assertJsonSuccess(`users.me.patch.${label}`, response, [200]);
}

function bootstrap() {
  const response = http.get(`${BASE_URL}/api/v1/bootstrap`);
  const body = assertJsonSuccess('bootstrap', response, [200]);
  check(response, {
    'bootstrap has task templates': () => Array.isArray(body.data.taskTemplates),
  });
}

function homeSummary(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/home/summary`, authHeaders(accessToken));
  assertJsonSuccess('home.summary', response, [200]);
}

function upsertCheckin(accessToken, note) {
  const response = http.put(
    `${BASE_URL}/api/v1/checkins/today`,
    JSON.stringify({
      moodLevel: 'BETTER',
      note,
    }),
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('checkins.upsertToday', response, [200]);
  return body.data;
}

function getCheckinToday(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/checkins/today`, authHeaders(accessToken));
  const body = assertJsonSuccess('checkins.today', response, [200]);
  return body.data;
}

function getCheckinHistory(accessToken, day) {
  const response = http.get(
    `${BASE_URL}/api/v1/checkins/history?from=${encodeURIComponent(day)}&to=${encodeURIComponent(day)}`,
    authHeaders(accessToken)
  );
  assertJsonSuccess('checkins.history', response, [200]);
}

function getDailyTasksToday(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/daily-tasks/today`, authHeaders(accessToken));
  const body = assertJsonSuccess('dailyTasks.today', response, [200]);
  return body.data || [];
}

function updateFirstDailyTask(accessToken, tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return;
  }

  const firstTask = tasks[0];
  const response = http.put(
    `${BASE_URL}/api/v1/daily-tasks/${encodeURIComponent(firstTask.code)}/status`,
    JSON.stringify({ isDone: true }),
    authHeaders(accessToken)
  );
  assertJsonSuccess('dailyTasks.updateStatus', response, [200]);
}

function getDailyTaskHistory(accessToken, day) {
  const response = http.get(
    `${BASE_URL}/api/v1/daily-tasks/history?from=${encodeURIComponent(day)}&to=${encodeURIComponent(day)}`,
    authHeaders(accessToken)
  );
  assertJsonSuccess('dailyTasks.history', response, [200]);
}

function createJournal(accessToken) {
  const response = http.post(
    `${BASE_URL}/api/v1/journal`,
    JSON.stringify({
      moodCode: 'CALM',
      content: `k6 full-system journal ${new Date().toISOString()} vu=${__VU} iter=${__ITER}`,
      entryAt: new Date().toISOString(),
    }),
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('journal.create', response, [201]);
  return body.data;
}

function listJournal(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/journal?page=0&size=10`, authHeaders(accessToken));
  assertJsonSuccess('journal.list', response, [200]);
}

function getJournal(accessToken, journalId) {
  const response = http.get(`${BASE_URL}/api/v1/journal/${journalId}`, authHeaders(accessToken));
  assertJsonSuccess('journal.getById', response, [200]);
}

function updateJournal(accessToken, journalId) {
  const response = http.patch(
    `${BASE_URL}/api/v1/journal/${journalId}`,
    JSON.stringify({
      content: `k6 updated journal ${new Date().toISOString()}`,
      moodCode: 'BETTER',
    }),
    authHeaders(accessToken)
  );
  assertJsonSuccess('journal.update', response, [200]);
}

function highlightJournal(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/journal/highlight`, authHeaders(accessToken));
  assertJsonSuccess('journal.highlight', response, [200]);
}

function deleteJournal(accessToken, journalId) {
  const response = http.del(`${BASE_URL}/api/v1/journal/${journalId}`, null, authHeaders(accessToken));
  assertStatus('journal.delete', response, [204]);
}

function getHealingTimeline(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/healing/timeline?days=30`, authHeaders(accessToken));
  assertJsonSuccess('healing.timeline', response, [200]);
}

function getNoContactCurrent(accessToken) {
  return http.get(
    `${BASE_URL}/api/v1/no-contact/current`,
    { ...authHeaders(accessToken), responseCallback: expected200or404 }
  );
}

function getNoContactHistory(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/no-contact/history?page=0&size=10`, authHeaders(accessToken));
  assertJsonSuccess('noContact.history', response, [200]);
}

function startNoContact(accessToken) {
  const response = http.post(`${BASE_URL}/api/v1/no-contact/start`, null, authHeaders(accessToken));
  const body = assertJsonSuccess('noContact.start', response, [201]);
  return body.data;
}

function resetNoContact(accessToken) {
  const response = http.post(
    `${BASE_URL}/api/v1/no-contact/reset`,
    JSON.stringify({ resetReason: 'k6 functional test reset' }),
    authHeaders(accessToken)
  );
  assertJsonSuccess('noContact.reset', response, [200]);
}

function runNoContactFlow(accessToken) {
  const currentResponse = getNoContactCurrent(accessToken);
  if (currentResponse.status === 404) {
    startNoContact(accessToken);
  } else {
    assertJsonSuccess('noContact.current', currentResponse, [200]);
  }

  getNoContactHistory(accessToken);
  resetNoContact(accessToken);
  getNoContactHistory(accessToken);
}

function startTriggerSession(accessToken, label) {
  const response = http.post(`${BASE_URL}/api/v1/emotional-trigger/sessions`, null, authHeaders(accessToken));
  const body = assertJsonSuccess(`trigger.start.${label}`, response, [201]);
  return body.data;
}

function completeTriggerSession(accessToken, sessionId) {
  const response = http.post(
    `${BASE_URL}/api/v1/emotional-trigger/sessions/${sessionId}/complete`,
    null,
    authHeaders(accessToken)
  );
  assertJsonSuccess('trigger.complete', response, [200]);
}

function cancelTriggerSession(accessToken, sessionId) {
  const response = http.post(
    `${BASE_URL}/api/v1/emotional-trigger/sessions/${sessionId}/cancel`,
    null,
    authHeaders(accessToken)
  );
  assertJsonSuccess('trigger.cancel', response, [200]);
}

function redirectTriggerSession(accessToken, sessionId) {
  const response = http.post(
    `${BASE_URL}/api/v1/emotional-trigger/sessions/${sessionId}/redirect-to-unsent`,
    null,
    authHeaders(accessToken)
  );
  assertJsonSuccess('trigger.redirectToUnsent', response, [200]);
}

function runTriggerFlow(accessToken) {
  const session1 = startTriggerSession(accessToken, 'complete');
  completeTriggerSession(accessToken, session1.id);

  const session2 = startTriggerSession(accessToken, 'cancel');
  cancelTriggerSession(accessToken, session2.id);

  const session3 = startTriggerSession(accessToken, 'redirect');
  redirectTriggerSession(accessToken, session3.id);
}

function ensureSecurityPassword(accessToken) {
  const response = http.post(
    `${BASE_URL}/api/v1/users/security-password`,
    JSON.stringify({ securityPassword: SECURITY_PASSWORD }),
    { ...authHeaders(accessToken), responseCallback: expected200or400 }
  );

  if (response.status >= 200 && response.status < 300) {
    const body = safeJson(response);
    check(response, {
      'securityPassword.setup success': () => body !== null && body.success === true,
    });
    return;
  }

  const body = safeJson(response);
  const alreadySet = body !== null &&
    typeof body.message === 'string' &&
    body.message.toLowerCase().includes('already set');

  if (!alreadySet) {
    failResponse('securityPassword.setup', response);
  }
}

function unlockUnsent(accessToken) {
  const response = http.post(
    `${BASE_URL}/api/v1/unsent-messages/unlock`,
    JSON.stringify({ securityPassword: SECURITY_PASSWORD }),
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('unsent.unlock', response, [200]);
  return body.data.unlockToken;
}

function createUnsent(accessToken, contentSuffix) {
  const response = http.post(
    `${BASE_URL}/api/v1/unsent-messages`,
    JSON.stringify({
      content: `k6 unsent ${contentSuffix}`,
    }),
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess(`unsent.create.${contentSuffix}`, response, [201]);
  return body.data;
}

function listUnsent(accessToken, unlockToken) {
  const response = http.get(
    `${BASE_URL}/api/v1/unsent-messages?status=ACTIVE&page=0&size=20`,
    authHeaders(accessToken, { 'X-Unlock-Token': unlockToken })
  );
  assertJsonSuccess('unsent.list', response, [200]);
}

function releaseUnsent(accessToken, messageId) {
  const response = http.post(
    `${BASE_URL}/api/v1/unsent-messages/${messageId}/release`,
    null,
    authHeaders(accessToken)
  );
  assertJsonSuccess('unsent.release', response, [200]);
}

function deleteUnsent(accessToken, messageId) {
  const response = http.del(
    `${BASE_URL}/api/v1/unsent-messages/${messageId}`,
    null,
    authHeaders(accessToken)
  );
  assertStatus('unsent.delete', response, [204]);
}

function runUnsentFlow(accessToken) {
  ensureSecurityPassword(accessToken);

  const messageToRelease = createUnsent(accessToken, `release ${new Date().toISOString()}`);
  const messageToDelete = createUnsent(accessToken, `delete ${new Date().toISOString()}`);
  const unlockToken = unlockUnsent(accessToken);

  listUnsent(accessToken, unlockToken);
  releaseUnsent(accessToken, messageToRelease.id);
  deleteUnsent(accessToken, messageToDelete.id);
}

function searchFriend(accessToken, query) {
  const response = http.get(
    `${BASE_URL}/api/v1/friends/search?q=${encodeURIComponent(query)}&page=0&size=20`,
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('friends.search', response, [200]);
  return body.data || [];
}

function listIncomingRequests(accessToken) {
  const response = http.get(
    `${BASE_URL}/api/v1/friends/requests/incoming?page=0&size=20`,
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('friends.incoming', response, [200]);
  return body.data || [];
}

function listOutgoingRequests(accessToken) {
  const response = http.get(
    `${BASE_URL}/api/v1/friends/requests/outgoing?page=0&size=20`,
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('friends.outgoing', response, [200]);
  return body.data || [];
}

function listFriends(accessToken, label) {
  const response = http.get(`${BASE_URL}/api/v1/friends?page=0&size=20`, authHeaders(accessToken));
  assertJsonSuccess(`friends.list.${label}`, response, [200]);
}

function sendFriendRequest(accessToken, receiverId) {
  const response = http.post(
    `${BASE_URL}/api/v1/friends/requests`,
    JSON.stringify({
      receiverId,
      message: 'k6 functional friend request',
    }),
    { ...authHeaders(accessToken), responseCallback: expected201or409 }
  );

  if (response.status === 409) {
    return null;
  }

  const body = assertJsonSuccess('friends.sendRequest', response, [201]);
  return body.data;
}

function acceptFriendRequest(accessToken, requestId, label) {
  const response = http.post(
    `${BASE_URL}/api/v1/friends/requests/${requestId}/accept`,
    null,
    authHeaders(accessToken)
  );
  assertJsonSuccess(`friends.accept.${label}`, response, [200]);
}

function ensureFriendship(primarySession, partnerSession) {
  const searchResults = searchFriend(primarySession.accessToken, partnerSession.email);
  const partnerResult = searchResults.find((item) => item.email === partnerSession.email);

  if (!partnerResult) {
    fail(`Could not find partner user ${partnerSession.email} in friend search.`);
  }

  if (partnerResult.relationStatus === 'FRIEND') {
    return;
  }

  if (partnerResult.relationStatus === 'NONE') {
    sendFriendRequest(primarySession.accessToken, partnerSession.userId);
    sleep(0.1);
  }

  if (partnerResult.relationStatus === 'NONE' || partnerResult.relationStatus === 'REQUEST_SENT') {
    const incoming = listIncomingRequests(partnerSession.accessToken);
    const request = incoming.find((item) => item.sender && item.sender.email === primarySession.email);
    if (!request) {
      fail(`Incoming friend request from ${primarySession.email} was not found for ${partnerSession.email}.`);
    }
    acceptFriendRequest(partnerSession.accessToken, request.id, 'partner');
  } else if (partnerResult.relationStatus === 'REQUEST_RECEIVED') {
    const incoming = listIncomingRequests(primarySession.accessToken);
    const request = incoming.find((item) => item.sender && item.sender.email === partnerSession.email);
    if (!request) {
      fail(`Incoming friend request from ${partnerSession.email} was not found for ${primarySession.email}.`);
    }
    acceptFriendRequest(primarySession.accessToken, request.id, 'primary');
  }

  listOutgoingRequests(primarySession.accessToken);
  listFriends(primarySession.accessToken, 'primary');
  listFriends(partnerSession.accessToken, 'partner');
}

function openSupportConversation(accessToken) {
  const response = http.post(`${BASE_URL}/api/v1/chat/conversations/support`, null, authHeaders(accessToken));
  const body = assertJsonSuccess('chat.openSupportConversation', response, [200]);
  return body.data;
}

function openDirectConversation(accessToken, friendUserId) {
  const response = http.post(
    `${BASE_URL}/api/v1/chat/conversations/direct/${friendUserId}`,
    null,
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess('chat.openDirectConversation', response, [200]);
  return body.data;
}

function listConversations(accessToken, label) {
  const response = http.get(`${BASE_URL}/api/v1/chat/conversations?page=0&size=20`, authHeaders(accessToken));
  assertJsonSuccess(`chat.listConversations.${label}`, response, [200]);
}

function sendChatMessage(accessToken, conversationId, label, content) {
  const response = http.post(
    `${BASE_URL}/api/v1/chat/conversations/${conversationId}/messages`,
    JSON.stringify({ content }),
    authHeaders(accessToken)
  );
  const body = assertJsonSuccess(`chat.sendMessage.${label}`, response, [201]);
  return body.data;
}

function listMessages(accessToken, conversationId, label) {
  const response = http.get(
    `${BASE_URL}/api/v1/chat/conversations/${conversationId}/messages?page=0&size=50`,
    authHeaders(accessToken)
  );
  assertJsonSuccess(`chat.listMessages.${label}`, response, [200]);
}

function markConversationRead(accessToken, conversationId, label) {
  const response = http.post(
    `${BASE_URL}/api/v1/chat/conversations/${conversationId}/read`,
    null,
    authHeaders(accessToken)
  );
  assertStatus(`chat.markRead.${label}`, response, [204]);
}

function runSupportChatFlow(accessToken) {
  const conversation = openSupportConversation(accessToken);
  sendChatMessage(accessToken, conversation.id, 'support', `k6 support message ${new Date().toISOString()}`);
  listMessages(accessToken, conversation.id, 'support');
  markConversationRead(accessToken, conversation.id, 'support');
  listConversations(accessToken, 'support');
}

function runDirectChatFlow(primarySession, partnerSession) {
  ensureFriendship(primarySession, partnerSession);

  const conversation = openDirectConversation(primarySession.accessToken, partnerSession.userId);
  sendChatMessage(
    primarySession.accessToken,
    conversation.id,
    'direct.primary',
    `k6 direct message from ${primarySession.email} at ${new Date().toISOString()}`
  );
  sendChatMessage(
    partnerSession.accessToken,
    conversation.id,
    'direct.partner',
    `k6 direct reply from ${partnerSession.email} at ${new Date().toISOString()}`
  );

  listMessages(primarySession.accessToken, conversation.id, 'direct.primary');
  listMessages(partnerSession.accessToken, conversation.id, 'direct.partner');
  markConversationRead(primarySession.accessToken, conversation.id, 'direct.primary');
  markConversationRead(partnerSession.accessToken, conversation.id, 'direct.partner');
  listConversations(primarySession.accessToken, 'direct.primary');
  listConversations(partnerSession.accessToken, 'direct.partner');
}

export default function () {
  bootstrap();

  const primaryCredentials = resolvePrimaryCredentials();
  const primarySession = login(primaryCredentials);
  const primaryProfile = getMe(primarySession.accessToken, 'primary');

  refreshAuth(primarySession, 'primary');
  updateMe(primarySession.accessToken, primaryProfile, 'primary');
  homeSummary(primarySession.accessToken);

  const checkin = upsertCheckin(primarySession.accessToken, `k6 full-system checkin ${new Date().toISOString()}`);
  const today = checkin.checkinDate || getCheckinToday(primarySession.accessToken).checkinDate;

  getCheckinToday(primarySession.accessToken);
  getCheckinHistory(primarySession.accessToken, today);

  const tasks = getDailyTasksToday(primarySession.accessToken);
  updateFirstDailyTask(primarySession.accessToken, tasks);
  getDailyTaskHistory(primarySession.accessToken, today);

  const journal = createJournal(primarySession.accessToken);
  listJournal(primarySession.accessToken);
  getJournal(primarySession.accessToken, journal.id);
  updateJournal(primarySession.accessToken, journal.id);
  highlightJournal(primarySession.accessToken);
  getHealingTimeline(primarySession.accessToken);
  deleteJournal(primarySession.accessToken, journal.id);

  if (ENABLE_NO_CONTACT) {
    group('no-contact', function () {
      runNoContactFlow(primarySession.accessToken);
    });
  }

  if (ENABLE_TRIGGER) {
    group('trigger', function () {
      runTriggerFlow(primarySession.accessToken);
    });
  }

  if (ENABLE_UNSENT) {
    group('unsent', function () {
      runUnsentFlow(primarySession.accessToken);
    });
  }

  let partnerSession = null;
  if (ENABLE_SOCIAL) {
    const partnerCredentials = resolvePartnerCredentials();
    partnerSession = login(partnerCredentials);
    refreshAuth(partnerSession, 'partner');

    group('social-chat', function () {
      runDirectChatFlow(primarySession, partnerSession);
    });
  }

  if (ENABLE_SUPPORT_CHAT) {
    group('support-chat', function () {
      runSupportChatFlow(primarySession.accessToken);
    });
  }

  logout(primarySession.accessToken, 'primary');
  if (partnerSession) {
    logout(partnerSession.accessToken, 'partner');
  }

  sleep(THINK_TIME);
}
