import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./config";
import { TokenStorage, ensureValidAccessToken } from "./apiClient";

function toWebSocketUrl(baseUrl: string) {
  const url = new URL(baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function createRealtimeClient() {
  const token = TokenStorage.getAccess();
  if (!token) return null;

  const client = new Client({
    brokerURL: toWebSocketUrl(API_BASE_URL),
    connectHeaders: {},
    beforeConnect: async () => {
      try {
        const freshToken = await ensureValidAccessToken();
        client.connectHeaders = {
          Authorization: `Bearer ${freshToken}`,
        };
        client.reconnectDelay = 5000;
      } catch (error) {
        client.reconnectDelay = 0;
        throw error;
      }
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  return client;
}
