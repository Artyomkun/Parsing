import { StreamChunk, StreamResponse } from '@server/app/schemas/auth';
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSSEOptions {
    url: string;
    onMessage?: (data: StreamChunk) => void;
    onError?: (error: Event) => void;
    onOpen?: () => void;
    onClose?: () => void;
    autoConnect?: boolean;
    withCredentials?: boolean;
    retry?: boolean;
    retryInterval?: number;
    maxRetries?: number;
}

interface UseSSEReturn {
    data: StreamChunk | null;
    error: Event | null;
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => void;
    disconnect: () => void;
    retryCount: number;
}

export const useSSE = (options: UseSSEOptions): UseSSEReturn => {
    const {
        url,
        onMessage,
        onError,
        onOpen,
        onClose,
        autoConnect = true,
        withCredentials = false,
        retry = true,
        retryInterval = 3000,
        maxRetries = 5
    } = options;

    const [data, setData] = useState<StreamChunk | null>(null);
    const [error, setError] = useState<Event | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            disconnect();
        }

        setIsConnecting(true);
        setError(null);

        try {
            const eventSource = new EventSource(url, { withCredentials });
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log('SSE connection opened');
                setIsConnected(true);
                setIsConnecting(false);
                setRetryCount(0);
                onOpen?.();
            };

            eventSource.onmessage = (event) => {
                try {
                    const streamResponse: StreamResponse = JSON.parse(event.data);
                    
                    if (streamResponse.event === 'chunk' && streamResponse.data) {
                        const chunkData = streamResponse.data;
                        setData(chunkData);
                        onMessage?.(chunkData);
                    } else if (streamResponse.event === 'complete') {
                        console.log('SSE stream completed');
                    } else if (streamResponse.event === 'error') {
                        console.error('SSE stream error:', streamResponse.data.chunk);
                        const errorEvent = new Event('error');
                        (errorEvent as any).data = streamResponse.data;
                        handleError(errorEvent);
                    }
                } catch (parseError) {
                    console.error('Error parsing SSE data:', parseError);
                    const errorEvent = new Event('parse_error');
                    (errorEvent as any).error = parseError;
                    handleError(errorEvent);
                }
            };

            eventSource.addEventListener('custom_event', (event) => {
                console.log('Custom SSE event:', event);
            });

            eventSource.onerror = (event) => {
                console.error('SSE connection error:', event);
                handleError(event);
            };
        } catch (err) {
            console.error('Error creating EventSource:', err);
            const errorEvent = new Event('connection_error');
            (errorEvent as any).error = err;
            handleError(errorEvent);
        }
    }, [url, withCredentials, onMessage, onOpen]);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }

        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        setIsConnected(false);
        setIsConnecting(false);
        onClose?.();
    }, [onClose]);

    const handleError = useCallback((event: Event) => {
        setError(event);
        setIsConnected(false);
        setIsConnecting(false);
        onError?.(event);

        if (retry && retryCount < maxRetries) {
            const nextRetryCount = retryCount + 1;
            setRetryCount(nextRetryCount);
            console.log(`Retrying SSE connection in ${retryInterval}ms (attempt ${nextRetryCount}/${maxRetries})`);
            retryTimeoutRef.current = setTimeout(() => {connect();}, retryInterval);
        } else if (retryCount >= maxRetries) {
            console.error(`Max retry attempts (${maxRetries}) exceeded for SSE connection`);
        }
    }, [retry, retryCount, maxRetries, retryInterval, connect, onError]);

    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    useEffect(() => {
        if (autoConnect && isConnected) {
            disconnect();
            connect();
        }
    }, [url]);

    return {
        data,
        error,
        isConnected,
        isConnecting,
        connect,
        disconnect,
        retryCount
    };
};

interface UseChatStreamOptions {
    url: string;
    onChunk?: (chunk: string, done: boolean) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: string) => void;
}

interface UseChatStreamReturn {
    text: string;
    isStreaming: boolean;
    isComplete: boolean;
    error: string | null;
    connect: () => void;
    disconnect: () => void;
    reset: () => void;
}

export const useChatStream = (options: UseChatStreamOptions): UseChatStreamReturn => {
    const { url, onChunk, onComplete, onError } = options;
    const [text, setText] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const accumulatedTextRef = useRef('');
    const handleMessage = useCallback((chunkData: StreamChunk) => {
        if (chunkData.chunk) {
            accumulatedTextRef.current += chunkData.chunk;
            setText(accumulatedTextRef.current);
            onChunk?.(chunkData.chunk, chunkData.done);
        }
        if (chunkData.done) {
            setIsStreaming(false);
            setIsComplete(true);
            onComplete?.(accumulatedTextRef.current);
        } else {
            setIsStreaming(true);
        }
    }, [onChunk, onComplete]);
    const handleError = useCallback((event: Event) => {
        const errorMessage = (event as any).data?.chunk || 'Connection error';
        setError(errorMessage);
        setIsStreaming(false);
        onError?.(errorMessage);
    }, [onError]);
    const handleOpen = useCallback(() => {
        setError(null);
        setIsStreaming(true);
        setIsComplete(false);
    }, []);
    const handleClose = useCallback(() => {
        setIsStreaming(false);
    }, []);
    const { connect, disconnect } = useSSE({
        url,
        onMessage: handleMessage,
        onError: handleError,
        onOpen: handleOpen,
        onClose: handleClose,
        autoConnect: false
    });
    const reset = useCallback(() => {
        disconnect();
        setText('');
        setError(null);
        setIsStreaming(false);
        setIsComplete(false);
        accumulatedTextRef.current = '';
    }, [disconnect]);

    return {
        text,
        isStreaming,
        isComplete,
        error,
        connect,
        disconnect,
        reset
    };
};

interface UseSSEWithAuthOptions extends Omit<UseSSEOptions, 'url'> {
    endpoint: string;
    token?: string;
    queryParams?: Record<string, string>;
}

export const useSSEWithAuth = (options: UseSSEWithAuthOptions) => {
    const { endpoint, token, queryParams = {}, ...sseOptions } = options;
    const buildUrl = useCallback(() => {
        const baseUrl = process.env.BASE_API_URL;
        const url = new URL(`${baseUrl}${endpoint}`);
        if (token) {
            url.searchParams.set('token', token);
        }
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        
        return url.toString();
    }, [endpoint, token, queryParams]);
    const url = buildUrl();

    return useSSE({
        url,
        ...sseOptions,
        withCredentials: Boolean(token)
    });
};

interface UseMultipleSSEReturn {
    connections: Map<string, UseSSEReturn>;
    addConnection: (id: string, options: UseSSEOptions) => void;
    removeConnection: (id: string) => void;
    getConnection: (id: string) => UseSSEReturn | undefined;
}

export const useMultipleSSE = (): UseMultipleSSEReturn => {
    const [connections, setConnections] = useState<Map<string, UseSSEReturn>>(new Map());
    const addConnection = useCallback((id: string, options: UseSSEOptions) => {
    const connection = useSSE(options);
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
        getConnection
    };
};

export const SSEUtils = {
    createSSEUrl: (endpoint: string, token?: string, params?: Record<string, string>): string => {
        const baseUrl = process.env.BASE_API_URL;
        const url = new URL(`${baseUrl}${endpoint}`);
        if (token) {
            url.searchParams.set('token', token);
        }
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.set(key, value);
            });
        }
        
        return url.toString();
    },
    isSSESupported: (): boolean => {
        return typeof EventSource !== 'undefined';
    },
    createCustomEvent: (type: string, data: any): MessageEvent => {
        return new MessageEvent(type, {
            data: JSON.stringify(data)
        });
    }
};