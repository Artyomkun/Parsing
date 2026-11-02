import type { Server, IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { SecurityService } from '../core/security';
import { UserService } from '../services/user_service';

export type WSMessage = Record<string, unknown>;

interface AuthenticatedSocket extends WebSocket {
    userId?: string;
    connectionId?: string;
}

export class WebSocketManager {
    private activeConnections = new Map<string, Map<string, WebSocket>>();
    private groups = new Map<string, Set<string>>();

    async connect(websocket: WebSocket, userId: string): Promise<string> {
        const connectionId = crypto.randomUUID();

        if (!this.activeConnections.has(userId)) {
            this.activeConnections.set(userId, new Map());
        }

        this.activeConnections.get(userId)!.set(connectionId, websocket);
        console.log(`User ${userId} connected with connection ${connectionId}`);

        return connectionId;
    }

    disconnect(userId: string, connectionId: string): void {
        const connections = this.activeConnections.get(userId);
        if (!connections) {return;}

        connections.delete(connectionId);
        console.log(`User ${userId} disconnected connection ${connectionId}`);

        if (connections.size === 0) {
            this.activeConnections.delete(userId);
        }
    }

    async sendPersonalMessage(message: WSMessage, userId: string): Promise<boolean> {
        const connections = this.activeConnections.get(userId);
        if (!connections) {return false;}

        let success = true;
        const disconnected: string[] = [];

        for (const [connectionId, ws] of connections) {
            try {
                if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(message));
                } else {
                disconnected.push(connectionId);
                success = false;
                }
            } catch (error) {
                console.error(`Failed to send message to ${userId}:`, error);
                disconnected.push(connectionId);
                success = false;
            }
        }

        for (const connectionId of disconnected) {
            this.disconnect(userId, connectionId);
        }

        return success;
    }

    async broadcast(message: WSMessage): Promise<void> {
        const disconnected: Array<[string, string]> = [];

        for (const [userId, connections] of this.activeConnections) {
            for (const [connectionId, ws] of connections) {
                try {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify(message));
                }
                } catch (error) {
                console.error(`Failed to broadcast to ${userId}:`, error);
                disconnected.push([userId, connectionId]);
                }
            }
        }

        for (const [userId, connectionId] of disconnected) {
            this.disconnect(userId, connectionId);
        }
    }

    async broadcastTyping(
        userId: string,
        conversationId: string,
        isTyping = true
    ): Promise<void> {
        const connections = this.activeConnections.get(userId);
        if (!connections) {return;}

        const message: WSMessage = {
            type: 'typing',
            user_id: userId,
            conversation_id: conversationId,
            is_typing: isTyping,
        };

        for (const ws of connections.values()) {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }

    async broadcastMessage(
        conversationId: string,
        message: WSMessage,
        excludeUserId: string
    ): Promise<void> {
        for (const [userId, connections] of this.activeConnections) {
            if (userId === excludeUserId) {continue;}

            const payload: WSMessage = {
                type: 'message',
                conversation_id: conversationId,
                message,
            };

            for (const ws of connections.values()) {
                if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(payload));
                }
            }
        }
    }

    async sendToGroup(message: WSMessage, groupName: string): Promise<void> {
        const members = this.groups.get(groupName);
        if (!members) {return;}

        const disconnected: Array<[string, string]> = [];

        for (const userId of members) {
        const connections = this.activeConnections.get(userId);
        if (!connections) {continue;}

        for (const [connectionId, ws] of connections) {
            try {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            } catch (error) {
                console.error(`Failed to send to group ${groupName} user ${userId}:`, error);
                disconnected.push([userId, connectionId]);
            }
        }
        }

        for (const [userId, connectionId] of disconnected) {
            this.disconnect(userId, connectionId);
        }
    }

    addToGroup(userId: string, groupName: string): void {
        if (!this.groups.has(groupName)) {
            this.groups.set(groupName, new Set());
        }
        this.groups.get(groupName)!.add(userId);
        console.log(`User ${userId} added to group ${groupName}`);
    }

    removeFromGroup(userId: string, groupName: string): void {
        const members = this.groups.get(groupName);
        if (!members) {return;}

        members.delete(userId);
        console.log(`User ${userId} removed from group ${groupName}`);

        if (members.size === 0) {
            this.groups.delete(groupName);
        }
    }

    getOnlineUsers(): string[] {
        return [...this.activeConnections.keys()];
    }

    isUserOnline(userId: string): boolean {
        return this.activeConnections.has(userId);
    }

    getUserConnectionsCount(userId: string): number {
        return this.activeConnections.get(userId)?.size ?? 0;
    }

    async closeAllConnections(): Promise<void> {
        for (const connections of this.activeConnections.values()) {
            for (const [connectionId, ws] of connections) {
                try {
                    ws.close();
                } catch (error) {
                    console.error(`Error closing connection ${connectionId}:`, error);
                }
            }
        }

        this.activeConnections.clear();
        this.groups.clear();
    }
}

export const websocketManager = new WebSocketManager();

const getTokenFromRequest = (req: IncomingMessage): string | null => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const tokenFromQuery = url.searchParams.get('token');
    if (tokenFromQuery) {return tokenFromQuery;}

    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {return null;}

    const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
            const [k, ...v] = c.trim().split('=');
            return [k, v.join('=')];
        })
    );

    return cookies['access_token'] ?? null;
};

const authenticateWs = async (req: IncomingMessage) => {
    const token = getTokenFromRequest(req);
    if (!token) {return null;}

    const payload = await SecurityService.verifyToken(token);
    if (!payload || !payload.sub) {return null;}

    const user = await UserService.getById(payload.sub);
    if (!user || !user.is_active) {return null;}

    return user;
};

const handleWebSocketMessage = async (userId: string, data: WSMessage): Promise<void> => {
    const type = data.type;

    if (type === 'ping') {
        await websocketManager.sendPersonalMessage(
            { type: 'pong', timestamp: new Date().toISOString() },
            userId
        );
        return;
    }

    if (type === 'chat_message') {
        const content = data.content;
        const conversationId = data.conversation_id;

        if (typeof content === 'string' && typeof conversationId === 'string') {
            await websocketManager.sendPersonalMessage(
                {
                    type: 'message_sent',
                    message_id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                },
                userId
            );
        }
    }
};

export const setupWebSocket = (server: Server): void => {
    const wss = new WebSocketServer({ noServer: true });
    server.on('upgrade', async (req, socket, head) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
        const pathname = url.pathname;
        const wsMatch = pathname.match(/^\/ws\/([^/]+)$/);
        const chatMatch = pathname.match(/^\/ws\/chat\/([^/]+)$/);

        if (!wsMatch && !chatMatch) {
            socket.destroy();
            return;
        }

        const user = await authenticateWs(req);
        if (!user) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            const authWs = ws as AuthenticatedSocket;
            authWs.userId = String(user.id);

            if (wsMatch) {
                handleGeneralWs(authWs, user.id);
            } else if (chatMatch) {
                handleChatWs(authWs, user.id, chatMatch[1]);
            }
        });
    });
};

const handleGeneralWs = async (ws: AuthenticatedSocket, userId: string): Promise<void> => {
    const connectionId = await websocketManager.connect(ws, userId);
    ws.connectionId = connectionId;

    ws.on('message', async (raw) => {
        try {
            const data = JSON.parse(raw.toString()) as WSMessage;
            await handleWebSocketMessage(userId, data);
        } catch (error) {
            console.error(`WebSocket message error for user ${userId}:`, error);
        }
    });

    ws.on('close', () => {
        websocketManager.disconnect(userId, connectionId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
        websocketManager.disconnect(userId, connectionId);
    });
};

const handleChatWs = async (
    ws: AuthenticatedSocket,
    userId: string,
    conversationId: string
): Promise<void> => {
    const groupName = `chat_${conversationId}`;
    const connectionId = await websocketManager.connect(ws, userId);
    ws.connectionId = connectionId;

    websocketManager.addToGroup(userId, groupName);

    ws.on('message', async (raw) => {
        try {
            const data = JSON.parse(raw.toString()) as WSMessage;

            if (data.type === 'typing_indicator') {
                const payload = data.payload as { is_typing?: boolean };
                await websocketManager.broadcastTyping(
                    userId,
                    conversationId,
                    payload?.is_typing ?? false
                );
                return;
            }

            if (data.type === 'chat_message') {
                await websocketManager.sendToGroup(
                    {
                        type: 'chat_message',
                        user_id: userId,
                        message: data.content,
                        timestamp: new Date().toISOString(),
                    },
                    groupName
                );
            }
        } catch (error) {
            console.error(`Chat WebSocket error:`, error);
        }
    });

    ws.on('close', () => {
        websocketManager.removeFromGroup(userId, groupName);
        websocketManager.disconnect(userId, connectionId);
    });

    ws.on('error', (error) => {
        console.error(`Chat WebSocket error:`, error);
        websocketManager.removeFromGroup(userId, groupName);
        websocketManager.disconnect(userId, connectionId);
    });
};