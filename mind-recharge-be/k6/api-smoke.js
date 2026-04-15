import http from 'k6/http';
import { check, fail, group, sleep } from 'k6';

/*
  Smoke test for Mind Recharge backend.

  Public only:
    k6 run .\k6\api-smoke.js

  With auth flow:
    k6 run .\k6\api-smoke.js
    Script will auto-read .env if present.

  Example with 20 concurrent users:
    $env:VUS="20"
    $env:DURATION="1m"
    k6 run .\k6\api-smoke.js

  Optional env vars:
    BASE_URL=http://localhost:8080
    VUS=5
    DURATION=30s
    ITERATIONS=20
    SLEEP_SECONDS=1
    K6_DEVICE_NAME=k6-windows
    HTTP_REQ_DURATION_P95_MS=1500
    HTTP_REQ_FAILED_RATE=0.05
    K6_USE_ACCOUNT_POOL=true
    K6_ACCOUNT_PREFIX=loadtest
    K6_ACCOUNT_DOMAIN=mindrecharge.com
    K6_ACCOUNT_START=1
    K6_ACCOUNT_COUNT=20
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
      // Ignore missing file and continue to the next candidate.
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
const ENABLE_AUTH_FLOW = String(envValue('ENABLE_AUTH_FLOW', 'false')).toLowerCase() === 'true';
const EMAIL = envValue('K6_EMAIL', '');
const PASSWORD = envValue('K6_PASSWORD', '');
const DEVICE_NAME = envValue('K6_DEVICE_NAME', 'k6-windows');
const USE_ACCOUNT_POOL = String(envValue('K6_USE_ACCOUNT_POOL', 'false')).toLowerCase() === 'true';
const ACCOUNT_PREFIX = envValue('K6_ACCOUNT_PREFIX', 'loadtest');
const ACCOUNT_DOMAIN = envValue('K6_ACCOUNT_DOMAIN', 'mindrecharge.com');
const ACCOUNT_START = Number(envValue('K6_ACCOUNT_START', '1'));
const ACCOUNT_COUNT = Number(envValue('K6_ACCOUNT_COUNT', '20'));
const SLEEP_SECONDS = Number(envValue('SLEEP_SECONDS', '1'));
const HTTP_REQ_DURATION_P95_MS = Number(envValue('HTTP_REQ_DURATION_P95_MS', '1500'));
const HTTP_REQ_FAILED_RATE = Number(envValue('HTTP_REQ_FAILED_RATE', '0.05'));
let cachedAccessToken = null;

const ITERATIONS = envValue('ITERATIONS', '');
const executionConfig = ITERATIONS
  ? { iterations: Number(ITERATIONS) }
  : { duration: envValue('DURATION', '30s') };

export const options = {
  vus: Number(envValue('VUS', '1')),
  ...executionConfig,
  thresholds: {
    http_req_failed: [`rate<${HTTP_REQ_FAILED_RATE}`],
    http_req_duration: [`p(95)<${HTTP_REQ_DURATION_P95_MS}`],
  },
};

function jsonHeaders(extraHeaders) {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  };
}

function authHeaders(accessToken) {
  return jsonHeaders({
    Authorization: `Bearer ${accessToken}`,
  });
}

function safeJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function checkApiOk(response, body, name) {
  return check(response, {
    [`${name} status is 2xx`]: (res) => res.status >= 200 && res.status < 300,
    [`${name} body.success = true`]: () => body !== null && body.success === true,
  });
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function resolveCredentials() {
  if (USE_ACCOUNT_POOL) {
    if (!PASSWORD) {
      fail('K6_USE_ACCOUNT_POOL=true but K6_PASSWORD is missing.');
    }

    if (ACCOUNT_COUNT <= 0) {
      fail('K6_ACCOUNT_COUNT must be greater than 0.');
    }

    const zeroBasedVu = Math.max(__VU - 1, 0);
    const accountNumber = ACCOUNT_START + (zeroBasedVu % ACCOUNT_COUNT);

    return {
      email: `${ACCOUNT_PREFIX}${pad2(accountNumber)}@${ACCOUNT_DOMAIN}`,
      password: PASSWORD,
    };
  }

  return {
    email: EMAIL,
    password: PASSWORD,
  };
}

function login() {
  const credentials = resolveCredentials();
  const response = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: credentials.email,
      password: credentials.password,
      deviceName: `${DEVICE_NAME}-vu-${__VU}`,
    }),
    jsonHeaders()
  );

  const body = safeJson(response);

  const passed = check(response, {
    'login status is 200': (res) => res.status === 200,
    'login returns access token': () =>
      body !== null &&
      body.success === true &&
      body.data !== null &&
      typeof body.data.accessToken === 'string' &&
      body.data.accessToken.length > 0,
  });

  if (!passed) {
    fail(`Login failed. status=${response.status} body=${response.body}`);
  }

  return body.data.accessToken;
}

function getAccessToken() {
  if (cachedAccessToken) {
    return cachedAccessToken;
  }

  cachedAccessToken = login();
  return cachedAccessToken;
}

function upsertTodayCheckin(accessToken) {
  const response = http.put(
    `${BASE_URL}/api/v1/checkins/today`,
    JSON.stringify({
      moodLevel: 'BETTER',
      note: 'Created by k6 to stabilize GET /checkins/today',
    }),
    authHeaders(accessToken)
  );

  const body = safeJson(response);

  const passed = check(response, {
    'checkins.upsert status is 2xx': (res) => res.status >= 200 && res.status < 300,
    'checkins.upsert body.success = true': () => body !== null && body.success === true,
  });

  if (!passed) {
    fail(`Check-in upsert failed. status=${response.status} body=${response.body}`);
  }
}

function ensureTodayCheckin(accessToken) {
  const response = http.get(`${BASE_URL}/api/v1/checkins/today`, authHeaders(accessToken));
  if (response.status === 404) {
    upsertTodayCheckin(accessToken);
  }
}

export function setup() {
  const bootstrapResponse = http.get(`${BASE_URL}/api/v1/bootstrap`);
  const bootstrapBody = safeJson(bootstrapResponse);

  const bootstrapPassed = checkApiOk(bootstrapResponse, bootstrapBody, 'bootstrap.setup') &&
    check(bootstrapResponse, {
      'bootstrap.setup has taskTemplates': () => {
        return (
          bootstrapBody !== null &&
          bootstrapBody.data !== null &&
          Array.isArray(bootstrapBody.data.taskTemplates)
        );
      },
    });

  if (!bootstrapPassed) {
    fail(`Bootstrap check failed in setup. status=${bootstrapResponse.status} body=${bootstrapResponse.body}`);
  }

  if (ENABLE_AUTH_FLOW && !USE_ACCOUNT_POOL && (!EMAIL || !PASSWORD)) {
    fail('ENABLE_AUTH_FLOW=true but K6_EMAIL or K6_PASSWORD is missing.');
  }

  return {};
}

export default function () {
  group('public.bootstrap', function () {
    const response = http.get(`${BASE_URL}/api/v1/bootstrap`);
    const body = safeJson(response);

    checkApiOk(response, body, 'bootstrap');
    check(response, {
      'bootstrap has moodOptions': () => {
        return body !== null && body.data !== null && Array.isArray(body.data.moodOptions);
      },
    });
  });

  if (ENABLE_AUTH_FLOW) {
    const accessToken = getAccessToken();
    ensureTodayCheckin(accessToken);

    group('auth.users.me', function () {
      const response = http.get(`${BASE_URL}/api/v1/users/me`, authHeaders(accessToken));
      const body = safeJson(response);

      checkApiOk(response, body, 'users.me');
      check(response, {
        'users.me returns user id': () => {
          return body !== null && body.data !== null && body.data.id !== null;
        },
      });
    });

    group('auth.home.summary', function () {
      const response = http.get(`${BASE_URL}/api/v1/home/summary`, authHeaders(accessToken));
      const body = safeJson(response);

      checkApiOk(response, body, 'home.summary');
      check(response, {
        'home.summary has totalTasksToday': () => {
          return (
            body !== null &&
            body.data !== null &&
            typeof body.data.totalTasksToday === 'number'
          );
        },
      });
    });

    group('auth.checkins.today', function () {
      const response = http.get(`${BASE_URL}/api/v1/checkins/today`, authHeaders(accessToken));
      const body = safeJson(response);

      checkApiOk(response, body, 'checkins.today');
    });

    group('auth.daily-tasks.today', function () {
      const response = http.get(`${BASE_URL}/api/v1/daily-tasks/today`, authHeaders(accessToken));
      const body = safeJson(response);

      checkApiOk(response, body, 'daily-tasks.today');
      check(response, {
        'daily-tasks.today returns array': () => {
          return body !== null && Array.isArray(body.data);
        },
      });
    });
  }

  sleep(SLEEP_SECONDS);
}
