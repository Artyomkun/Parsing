import { Conversation, Message } from '@server/app/models/chat';
import { CreateConversationRequest, MessageRole, MessageStatus, SendMessageRequest, StreamChunk } from '@server/app/schemas/auth';
import { chatApi } from '@server/app/services/api';
import { useState, useEffect, useCallback, useContext, createContext, ReactNode, useRef } from 'react';

interface ChatContextType {
    currentConversation: Conversation | null;
    conversations: Conversation[];
    messages: Message[];
    isLoading: boolean;
    isStreaming: boolean;
    error: string | null;
    sendMessage: (request: SendMessageRequest) => Promise<void>;
    createConversation: (data: CreateConversationRequest) => Promise<Conversation>;
    updateConversation: (id: string, updates: Partial<Conversation>) => Promise<Conversation>;
    deleteConversation: (id: string) => Promise<void>;
    loadConversation: (id: string) => Promise<void>;
    loadConversations: () => Promise<void>;
    clearError: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const streamAbortRef = useRef<(() => void) | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const setErrorWithTimeout = useCallback((message: string, timeout: number = 5000) => {
        setError(message);
        setTimeout(() => {
            setError(null);
        }, timeout);
    }, []);

    const createMessage = useCallback(
        (
            content: string,
            role: MessageRole,
            conversationId: string,
        ): Message => ({
            id: crypto.randomUUID(),
            conversation_id: conversationId,
            user_id: '',
            content,
            role,
            message_type: 'text',
            status: MessageStatus.SENDING,
            moderation_passed: true,
            moderation_notes: [],
            created_at: new Date(),
            updated_at: new Date(),
        }),
        [],
    );

    useEffect(() => {
        return () => {
            streamAbortRef.current?.();
        };
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await chatApi.getConversations({
                skip: 0,
                limit: 50,
                archived_only: false,
            });
            setConversations(response.conversations);
        } catch (err: any) {
            setErrorWithTimeout(err.message || 'Ошибка загрузки диалогов');
        } finally {
            setIsLoading(false);
        }
    }, [setErrorWithTimeout]);

    const loadConversation = useCallback(async (conversationId: string) => {
        try {
            setIsLoading(true);
            const conversation = await chatApi.getConversation(conversationId);
            setCurrentConversation(conversation);
            setMessages(conversation.messages ?? []);
            setConversations(prev => prev.map(conv => conv.id === conversationId ? conversation : conv));
        } catch (err: any) {
            setErrorWithTimeout(err.message || 'Ошибка загрузки диалога');
        } finally {
            setIsLoading(false);
        }
    }, [setErrorWithTimeout]);

    const createConversation = useCallback(async (data: CreateConversationRequest): Promise<Conversation> => {
      try {
          setIsLoading(true);
          const newConversation = await chatApi.createConversation(data);

          setCurrentConversation(newConversation);
          setMessages([]);
          setConversations(prev => [newConversation, ...prev]);
          return newConversation;
      } catch (err: any) {
          const errorMessage = err.message || 'Ошибка создания диалога';
          setErrorWithTimeout(errorMessage);
          throw new Error(errorMessage, { cause: err });
      } finally {
          setIsLoading(false);
      }
    }, [setErrorWithTimeout]);

    const updateConversation = useCallback(async (
        conversationId: string,
        updates: Partial<Conversation>
    ): Promise<Conversation> => {
        try {
            const updatedConversation = await chatApi.updateConversation(conversationId, updates);
            if (currentConversation?.id === conversationId) {
                setCurrentConversation(updatedConversation);
            }

            setConversations(prev =>
                prev.map(conv =>
                    conv.id === conversationId ? updatedConversation : conv
                )
            );

            return updatedConversation;
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка обновления диалога';
            setErrorWithTimeout(errorMessage);
            throw new Error(errorMessage, { cause: err });
        }
    }, [currentConversation?.id, setErrorWithTimeout]);

    const deleteConversation = useCallback(async (conversationId: string) => {
        try {
            await chatApi.deleteConversation(conversationId);
            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            if (currentConversation?.id === conversationId) {
              setCurrentConversation(null);
              setMessages([]);
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Ошибка удаления диалога';
            setErrorWithTimeout(errorMessage);
            throw new Error(errorMessage, { cause: err });
        }
    }, [currentConversation?.id, setErrorWithTimeout]);

    const handleDirectMessage = useCallback(async (
        request: SendMessageRequest,
        userMessage: Message,
    ) => {
        const response = await chatApi.sendMessage(request);
        setMessages(prev =>
            prev.map(msg =>
                msg.id === userMessage.id ? { ...msg, status: MessageStatus.SENT } : msg
            )
        );
        const assistantMessage = createMessage(
            response.content,
            MessageRole.ASSISTANT,
            response.conversation_id
        );
        assistantMessage.id = response.message_id;
        assistantMessage.created_at = new Date(response.timestamp);
        assistantMessage.updated_at = new Date(response.timestamp);
        setMessages(prev => [...prev, assistantMessage]);
        if (response.conversation_id && !currentConversation) {
            await loadConversation(response.conversation_id);
        }
    }, [currentConversation, loadConversation, createMessage]);

    const handleStreamingMessage = useCallback((
        request: SendMessageRequest,
        userMessage: Message
    ) => {
        streamAbortRef.current?.();
        streamAbortRef.current = null;
        let assistantId: string | null = null;

        const ensureAssistantMessage = (chunk: StreamChunk): string => {
            if (assistantId) {return assistantId;}

            const id = chunk.message_id || `msg_${Date.now()}_assistant`;
            assistantId = id;

            const assistantMessage = createMessage(
                '',
                MessageRole.ASSISTANT,
                request.conversation_id || currentConversation?.id || ''
            );
            assistantMessage.id = id;
            assistantMessage.complete = false;
            setMessages(prev => [...prev, assistantMessage]);

            return id;
        };

        setIsStreaming(true);

        streamAbortRef.current = chatApi.sendMessageStream(request, {
            onChunk: (chunk: StreamChunk) => {
                setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: MessageStatus.SENT } : msg));
                const id = ensureAssistantMessage(chunk);
                setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: msg.content + (chunk.chunk || ''), complete: chunk.done } : msg));
            },
            onComplete: (chunk: StreamChunk) => {
                const id = ensureAssistantMessage(chunk);
                setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, content: chunk.chunk || msg.content, complete: true } : msg));
                setIsStreaming(false);
                streamAbortRef.current = null;
                const conversationId = request.conversation_id || currentConversation?.id;
                if (conversationId && !currentConversation) {
                    void loadConversation(conversationId);
                }
            },
            onError: (message: string) => {
                setErrorWithTimeout(message);
                setIsStreaming(false);
                streamAbortRef.current = null;
                setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: MessageStatus.ERROR } : msg));
            },
        });
    }, [currentConversation, loadConversation, setErrorWithTimeout, createMessage]);

    const sendMessage = useCallback(async (request: SendMessageRequest) => {
        if (!request.message.trim()) {return;}
        const userMessage = createMessage(
            request.message,
            MessageRole.USER,
            request.conversation_id || currentConversation?.id || ''
        );
        userMessage.status = MessageStatus.SENDING;
        setMessages(prev => [...prev, userMessage]);
        if (request.stream) {
            handleStreamingMessage(request, userMessage);
            return;
        }

        setIsStreaming(true);
        try {
            await handleDirectMessage(request, userMessage);
        } catch (err: any) {
            setErrorWithTimeout(err.message || 'Ошибка отправки сообщения');
            setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: MessageStatus.ERROR } : msg));
        } finally {
          setIsStreaming(false);
        }
    }, [
        currentConversation?.id,
        setErrorWithTimeout,
        handleDirectMessage,
        handleStreamingMessage,
        createMessage,
    ]);

    const value: ChatContextType = {
        currentConversation,
        conversations,
        messages,
        isLoading,
        isStreaming,
        error,
        sendMessage,
        createConversation,
        updateConversation,
        deleteConversation,
        loadConversation,
        loadConversations,
        clearError,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export default useChat;
