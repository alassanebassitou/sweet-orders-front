import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { usePresenceStore } from '@/stores/presenceStore';

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
      // Presence
      stompClient?.subscribe('/topic/presence', (m) => {
        try {
          const { userId, status } = JSON.parse(m.body);
          if (!userId) return;
          if (status === 'ONLINE') usePresenceStore.getState().setOnline(userId);
          else usePresenceStore.getState().setOffline(userId);
        } catch {}
      });
      try {
        stompClient?.publish({
          destination: '/app/presence',
          body: JSON.stringify({ status: 'ONLINE' }),
        });
      } catch {}
    },
    onStompError: (frame) => console.error('STOMP error:', frame),
  });
  stompClient.activate();

  // Send offline on unload
  const handleUnload = () => {
    try {
      stompClient?.publish({
        destination: '/app/presence',
        body: JSON.stringify({ status: 'OFFLINE' }),
      });
    } catch {}
  };
  window.addEventListener('beforeunload', handleUnload);

  return stompClient;
};

export const disconnectWebSocket = () => {
  try {
    stompClient?.publish({
      destination: '/app/presence',
      body: JSON.stringify({ status: 'OFFLINE' }),
    });
  } catch {}
  stompClient?.deactivate();
  stompClient = null;
  usePresenceStore.getState().reset();
};
