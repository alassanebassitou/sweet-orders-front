import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient: Client | null = null;

export const connectWebSocket = (
  role: string,
  onCommandeUpdate: (event: any) => void,
  onNotification: (event: any) => void
) => {
  if (stompClient?.active) return stompClient;
  const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${wsUrl}/ws`),
    reconnectDelay: 5000,
    onConnect: () => {
      stompClient?.subscribe('/topic/commandes', (m) => {
        try { onCommandeUpdate(JSON.parse(m.body)); } catch {}
      });
      if (role === 'ROLE_ADMIN') {
        stompClient?.subscribe('/topic/notifications', (m) => {
          try { onNotification(JSON.parse(m.body)); } catch {}
        });
      }
    },
    onStompError: (frame) => console.error('STOMP error:', frame),
  });
  stompClient.activate();
  return stompClient;
};

export const disconnectWebSocket = () => {
  stompClient?.deactivate();
  stompClient = null;
};
