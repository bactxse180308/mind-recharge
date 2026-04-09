import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

function normalizeBaseUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, '');
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

let BASE_URL = webBaseUrl;

if (isNative) {
  BASE_URL = nativeBaseUrl ?? resolveNativeBaseUrl(webBaseUrl);
}

export const API_BASE_URL = BASE_URL;
