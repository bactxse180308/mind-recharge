import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
const API_BASE_OVERRIDE_KEY = 'mr_api_base_url';
const WEBRTC_ICE_SERVERS_ENV = 'VITE_WEBRTC_ICE_SERVERS';

function normalizeBaseUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
}

function isLocalOnlyHostname(value?: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '10.0.2.2';
  } catch {
    return false;
  }
}

function readRuntimeBaseUrlOverride(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const params = new URLSearchParams(window.location.search);
  const queryOverride = params.get('apiBaseUrl')?.trim();

  if (queryOverride) {
    if (queryOverride === 'clear' || queryOverride === 'auto') {
      localStorage.removeItem(API_BASE_OVERRIDE_KEY);
      return undefined;
    }

    const normalized = normalizeBaseUrl(queryOverride);
    if (normalized) {
      localStorage.setItem(API_BASE_OVERRIDE_KEY, normalized);
      return normalized;
    }
  }

  return normalizeBaseUrl(localStorage.getItem(API_BASE_OVERRIDE_KEY) || undefined);
}

function resolveNativeBaseUrl(webBaseUrl: string): string {
  try {
    const url = new URL(webBaseUrl);

    // Android emulator cannot reach the host machine through localhost.
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = '10.0.2.2';
    }

    return url.toString().replace(/\/+$/, '');
  } catch {
    return webBaseUrl;
  }
}

const webBaseUrl =
  normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ?? 'http://localhost:8080';
const nativeBaseUrl = normalizeBaseUrl(import.meta.env.VITE_NATIVE_API_BASE_URL);
const runtimeOverrideBaseUrl = readRuntimeBaseUrlOverride();

let BASE_URL = webBaseUrl;

if (isNative) {
  BASE_URL = isLocalOnlyHostname(nativeBaseUrl)
    ? webBaseUrl
    : nativeBaseUrl ?? resolveNativeBaseUrl(webBaseUrl);
}

if (runtimeOverrideBaseUrl) {
  BASE_URL = runtimeOverrideBaseUrl;
}

export const API_BASE_URL = BASE_URL;
export const API_BASE_SOURCE = runtimeOverrideBaseUrl
  ? 'runtime-override'
  : isNative
    ? 'native-env'
    : 'web-env';

function parseIceServers(): RTCIceServer[] {
  const rawValue = import.meta.env[WEBRTC_ICE_SERVERS_ENV]?.trim();
  if (!rawValue) {
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('ICE server config must be a non-empty array');
    }

    return parsed as RTCIceServer[];
  } catch (error) {
    console.error('[Call] Invalid VITE_WEBRTC_ICE_SERVERS config', error);
    return [{ urls: 'stun:stun.l.google.com:19302' }];
  }
}

export const WEBRTC_ICE_SERVERS = parseIceServers();
