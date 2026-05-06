import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { addLiveNotification, setUnreadCount } from '../store/slices/notificationSlice';
import { toast } from 'react-toastify';

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:8087/ws/notifications'
    : `${window.location.origin}/ws/notifications`);

const isStaticAuth = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('static-token-');
};

const useNotificationSocket = (userId) => {
  const dispatch = useDispatch();
  const clientRef = useRef(null);

  useEffect(() => {
    if (!userId || isStaticAuth()) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        // Per-user notification queue
        client.subscribe(`/user/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            dispatch(addLiveNotification(notification));
            toast.info(notification.title || 'New notification', {
              position: 'top-right',
              autoClose: 4000,
            });
          } catch (e) {
            console.error('Failed to parse notification:', e);
          }
        });

        // Unread count updates
        client.subscribe(`/user/queue/unread-count`, (message) => {
          try {
            dispatch(setUnreadCount(Number(message.body)));
          } catch (e) {
            console.error('Failed to parse unread count:', e);
          }
        });
      },
      onDisconnect: () => {
        console.debug('WebSocket disconnected');
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [userId, dispatch]);
};

export default useNotificationSocket;
