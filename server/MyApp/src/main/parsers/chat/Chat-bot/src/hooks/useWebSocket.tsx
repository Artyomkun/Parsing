import { useState, useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage, ChatMessagePayload, TypingIndicatorPayload } from '../types/chat';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnect?: (attempt: number) => void;
  autoConnect?: boolean;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeat?: boolean;
  heartbeatInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  message: WebSocketMessage | null;
  error: Event | null;
  sendMessage: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnectCount: number;
  lastActivity: Date | null;
}

/**
 * Хук для работы с WebSocket соединениями
 * Обеспечивает устойчивое соединение с автоматическим переподключением
 */
export const useWebSocket = (options: UseWebSocketOptions): UseWebSocketReturn => {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    onReconnect,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeat = true,
    heartbeatInterval = 30000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [message, setMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Функция отправки сообщения
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageData = typeof data === 'string' ? data : JSON.stringify(data);
        wsRef.current.send(messageData);
        setLastActivity(new Date());
      } catch (err) {
        console.error('Error sending WebSocket message:', err);
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent:', data);
    }
  }, []);

  // Функция отправки heartbeat
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: Date.now(),
      };
      sendMessage(heartbeatMessage);
    }
  }, [sendMessage]);

  // Функция подключения
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const websocket = new WebSocket(url);
      wsRef.current = websocket;

      // Обработчик открытия соединения
      websocket.onopen = (event) => {
        if (!isMountedRef.current) return;

        console.log('WebSocket connection opened');
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(0);
        setLastActivity(new Date());
        onOpen?.(event);

        // Запускаем heartbeat если включен
        if (heartbeat) {
          heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval);
        }
      };

      // Обработчик получения сообщений
      websocket.onmessage = (event) => {
        if (!isMountedRef.current) return;

        try {
          const messageData: WebSocketMessage = JSON.parse(event.data);
          setMessage(messageData);
          setLastActivity(new Date());
          onMessage?.(messageData);
        } catch (parseError) {
          console.error('Error parsing WebSocket message:', parseError);
          // Если не JSON, обрабатываем как текстовое сообщение
          const textMessage: WebSocketMessage = {
            type: 'text',
            payload: { content: event.data },
            timestamp: Date.now(),
          };
          setMessage(textMessage);
          onMessage?.(textMessage);
        }
      };

      // Обработчик закрытия соединения
      websocket.onclose = (event) => {
        if (!isMountedRef.current) return;

        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        onClose?.(event);

        // Очищаем heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Логика переподключения
        if (reconnect && reconnectCount < maxReconnectAttempts) {
          const nextAttempt = reconnectCount + 1;
          setReconnectCount(nextAttempt);

          console.log(`Reconnecting WebSocket in ${reconnectInterval}ms (attempt ${nextAttempt}/${maxReconnectAttempts})`);
          onReconnect?.(nextAttempt);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, reconnectInterval);
        }
      };

      // Обработчик ошибок
      websocket.onerror = (event) => {
        if (!isMountedRef.current) return;

        console.error('WebSocket connection error:', event);
        setError(event);
        setIsConnecting(false);
        onError?.(event);
      };

    } catch (err) {
      console.error('Error creating WebSocket connection:', err);
      setIsConnecting(false);
      setError(new Event('connection_error'));
    }
  }, [
    url,
    reconnect,
    reconnectCount,
    maxReconnectAttempts,
    reconnectInterval,
    heartbeat,
    heartbeatInterval,
    onOpen,
    onMessage,
    onClose,
    onError,
    onReconnect,
    sendHeartbeat,
  ]);

  // Функция отключения
  const disconnect = useCallback((code?: number, reason?: string) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(code || 1000, reason || 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setReconnectCount(0);
  }, []);

  // Эффект для автоматического подключения/отключения
  useEffect(() => {
    isMountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect(1000, 'Component unmounted');
    };
  }, [autoConnect, connect, disconnect]);

  // Эффект для переподключения при изменении URL
  useEffect(() => {
    if (autoConnect && isConnected) {
      disconnect();
      connect();
    }
  }, [url]);

  return {
    isConnected,
    isConnecting,
    message,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnectCount,
    lastActivity,
  };
};

// Специализированный хук для чата через WebSocket
interface UseChatWebSocketOptions extends Omit<UseWebSocketOptions, 'url'> {
  conversationId?: string;
  token?: string;
}

interface UseChatWebSocketReturn extends UseWebSocketReturn {
  sendChatMessage: (content: string, parentMessageId?: string) => void;
  sendTypingIndicator: (isTyping: boolean) => void;
  messages: WebSocketMessage[];
  typingUsers: Set<string>;
}

/**
 * Специализированный хук для чата через WebSocket
 */
export const useChatWebSocket = (options: UseChatWebSocketOptions): UseChatWebSocketReturn => {
  const { conversationId, token, ...wsOptions } = options;

  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Строим URL с параметрами
  const buildUrl = useCallback(() => {
    const baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const url = new URL(`${baseUrl}/ws/chat`);
    
    if (conversationId) {
      url.pathname += `/${conversationId}`;
    }
    
    if (token) {
      url.searchParams.set('token', token);
    }
    
    return url.toString();
  }, [conversationId, token]);

  const url = buildUrl();

  // Обработчик входящих сообщений
  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'chat_message':
        setMessages(prev => [...prev, message]);
        break;
        
      case 'typing_indicator':
        const typingPayload = message.payload as TypingIndicatorPayload;
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (typingPayload.is_typing) {
            newSet.add(typingPayload.user_id);
          } else {
            newSet.delete(typingPayload.user_id);
          }
          return newSet;
        });
        break;
        
      case 'message_update':
        // Обновляем существующее сообщение
        setMessages(prev => prev.map(msg => 
          msg.message_id === message.message_id 
            ? { ...msg, ...message.payload }
            : msg
        ));
        break;
        
      case 'user_joined':
      case 'user_left':
        console.log(`User ${message.type.replace('user_', '')}:`, message.payload);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }

    wsOptions.onMessage?.(message);
  }, [wsOptions.onMessage]);

  const {
    isConnected,
    isConnecting,
    message,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnectCount,
    lastActivity,
  } = useWebSocket({
    ...wsOptions,
    url,
    onMessage: handleMessage,
  });

  // Функция отправки сообщения чата
  const sendChatMessage = useCallback((content: string, parentMessageId?: string) => {
    const chatMessage: ChatMessagePayload = {
      content,
      conversation_id: conversationId,
      message_id: generateMessageId(),
      parent_message_id: parentMessageId,
      stream: true,
    };

    const wsMessage: WebSocketMessage = {
      type: 'chat_message',
      payload: chatMessage,
      timestamp: Date.now(),
      message_id: chatMessage.message_id,
    };

    sendMessage(wsMessage);
  }, [conversationId, sendMessage]);

  // Функция отправки индикатора набора текста
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!conversationId) return;

    const typingMessage: TypingIndicatorPayload = {
      is_typing: isTyping,
      user_id: 'current-user', // Будет заменено на реальный ID пользователя
      conversation_id: conversationId,
    };

    const wsMessage: WebSocketMessage = {
      type: 'typing_indicator',
      payload: typingMessage,
      timestamp: Date.now(),
    };

    sendMessage(wsMessage);
  }, [conversationId, sendMessage]);

  return {
    isConnected,
    isConnecting,
    message,
    error,
    sendMessage,
    connect,
    disconnect,
    reconnectCount,
    lastActivity,
    sendChatMessage,
    sendTypingIndicator,
    messages,
    typingUsers,
  };
};

// Хук для управления несколькими WebSocket соединениями
interface UseMultipleWebSocketsReturn {
  connections: Map<string, UseWebSocketReturn>;
  addConnection: (id: string, options: UseWebSocketOptions) => void;
  removeConnection: (id: string) => void;
  getConnection: (id: string) => UseWebSocketReturn | undefined;
  sendToConnection: (id: string, data: any) => void;
}

export const useMultipleWebSockets = (): UseMultipleWebSocketsReturn => {
  const [connections, setConnections] = useState<Map<string, UseWebSocketReturn>>(new Map());

  const addConnection = useCallback((id: string, options: UseWebSocketOptions) => {
    const connection = useWebSocket(options);
    
    setConnections(prev => {
      const newConnections = new Map(prev);
      newConnections.set(id, connection);
      return newConnections;
    });
  }, []);

  const removeConnection = useCallback((id: string) => {
    setConnections(prev => {
      const newConnections = new Map(prev);
      const connection = newConnections.get(id);
      
      if (connection) {
        connection.disconnect();
        newConnections.delete(id);
      }
      
      return newConnections;
    });
  }, []);

  const getConnection = useCallback((id: string) => {
    return connections.get(id);
  }, [connections]);

  const sendToConnection = useCallback((id: string, data: any) => {
    const connection = connections.get(id);
    if (connection) {
      connection.sendMessage(data);
    }
  }, [connections]);

  // Очистка всех соединений при размонтировании
  useEffect(() => {
    return () => {
      connections.forEach(connection => {
        connection.disconnect();
      });
    };
  }, []);

  return {
    connections,
    addConnection,
    removeConnection,
    getConnection,
    sendToConnection,
  };
};

// Вспомогательные функции
const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const WebSocketUtils = {
  /**
   * Проверяет поддержку WebSocket в браузере
   */
  isSupported: (): boolean => {
    return typeof WebSocket !== 'undefined';
  },

  /**
   * Возвращает готовое состояние WebSocket
   */
  getReadyState: (ws: WebSocket | null): string => {
    if (!ws) return 'CLOSED';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  },

  /**
   * Создает URL для WebSocket соединения
   */
  createWebSocketUrl: (endpoint: string, params?: Record<string, string>): string => {
    const baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
    const url = new URL(`${baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    
    return url.toString();
  },
};

export default useWebSocket;