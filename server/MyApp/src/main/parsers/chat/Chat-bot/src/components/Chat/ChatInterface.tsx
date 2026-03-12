import { useState, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  Message, Conversation, SendMessageRequest, 
  CreateConversationRequest, MessageRole, MessageStatus
} from '../../types/chat';
import { chatApi } from '../../services/api';

interface ChatContextType {
  // Состояние
  currentConversation: Conversation | null;
  conversations: Conversation[];
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  
  // Действия
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

  // Очистка ошибок
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Установка ошибки
  const setErrorWithTimeout = useCallback((message: string, timeout: number = 5000) => {
    setError(message);
    setTimeout(() => {
      setError(null);
    }, timeout);
  }, []);

  // Загрузка списка диалогов
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversations({
        skip: 0,
        limit: 50,
        archived_only: false,
      });
      
      if (response.success && response.data) {
        setConversations(response.data.conversations);
      }
    } catch (err: any) {
      setErrorWithTimeout(err.message || 'Ошибка загрузки диалогов');
    } finally {
      setIsLoading(false);
    }
  }, [setErrorWithTimeout]);

  // Загрузка конкретного диалога с сообщениями
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversation(conversationId);
      
      if (response.success && response.data) {
        const conversation = response.data;
        setCurrentConversation(conversation);
        setMessages(conversation.messages || []);
        
        // Обновляем список диалогов
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId ? conversation : conv
          )
        );
      }
    } catch (err: any) {
      setErrorWithTimeout(err.message || 'Ошибка загрузки диалога');
    } finally {
      setIsLoading(false);
    }
  }, [setErrorWithTimeout]);

  // Создание нового диалога
  const createConversation = useCallback(async (data: CreateConversationRequest): Promise<Conversation> => {
    try {
      setIsLoading(true);
      const response = await chatApi.createConversation(data);
      
      if (response.success && response.data) {
        const newConversation = response.data;
        setCurrentConversation(newConversation);
        setMessages([]);
        setConversations(prev => [newConversation, ...prev]);
        return newConversation;
      } else {
        const errorMessage = response.messages?.[0]?.content || response.message || 'Ошибка создания диалога';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка создания диалога';
      setErrorWithTimeout(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setErrorWithTimeout]);

  // Обновление диалога
  const updateConversation = useCallback(async (
    conversationId: string, 
    updates: Partial<Conversation>
  ): Promise<Conversation> => {
    try {
      const response = await chatApi.updateConversation(conversationId, updates);
      
      if (response.success && response.data) {
        const updatedConversation = response.data;
        
        // Обновляем текущий диалог если он активен
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(updatedConversation);
        }
        
        // Обновляем в списке диалогов
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId ? updatedConversation : conv
          )
        );
        
        return updatedConversation;
      } else {
        const errorMessage = response.messages?.[0]?.content || response.message || 'Ошибка обновления диалога';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка обновления диалога';
      setErrorWithTimeout(errorMessage);
      throw err;
    }
  }, [currentConversation?.id, setErrorWithTimeout]);

  // Удаление диалога
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await chatApi.deleteConversation(conversationId);
      
      // Удаляем из списка диалогов
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Если удаленный диалог был текущим, очищаем состояние
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ошибка удаления диалога';
      setErrorWithTimeout(errorMessage);
      throw err;
    }
  }, [currentConversation?.id, setErrorWithTimeout]);

  // Обработка прямого сообщения (без потоковой генерации)
  const handleDirectMessage = useCallback(async (
    request: SendMessageRequest,
    userMessage: Message
  ) => {
    const response = await chatApi.sendMessage(request);
    
    if (response.message) {
      // Обновляем сообщение пользователя
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'sent' as MessageStatus }
            : msg
        )
      );
      
      // Добавляем сообщение ассистента
      setMessages(prev => [...prev, response.message]);
      
      // Обновляем текущий диалог если нужно
      if (response.conversation_id && !currentConversation) {
        await loadConversation(response.conversation_id);
      }
    }
  }, [currentConversation, loadConversation]);

  // Обработка потокового сообщения
  const handleStreamingMessage = useCallback(async (
    request: SendMessageRequest,
    userMessage: Message
  ) => {
    // Создаем временное сообщение ассистента
    const tempAssistantMessage: Message = {
      id: `temp-assistant-${Date.now()}`,
      content: '',
      role: 'assistant' as MessageRole,
      timestamp: new Date(),
      complete: false,
      conversation_id: request.conversation_id || currentConversation?.id || '',
    };

    setMessages(prev => [...prev, tempAssistantMessage]);

    // Здесь будет логика для SSE потока
    // В реальном приложении это будет обрабатываться через useSSE хук
    // и обновлять сообщение ассистента по chunk'ам

    // Пока просто отмечаем, что поток начался
    console.log('Streaming started for message:', tempAssistantMessage.id);

    // Обновляем статус сообщения пользователя
    setMessages(prev => 
      prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, status: 'sent' as MessageStatus }
          : msg
      )
    );
  }, [currentConversation?.id]);

  // Отправка сообщения
  const sendMessage = useCallback(async (request: SendMessageRequest) => {
    if (!request.message.trim()) return;

    let userMessage: Message;

    try {
      // Создаем временное сообщение пользователя
      userMessage = {
        id: `temp-${Date.now()}`,
        content: request.message,
        role: 'user' as MessageRole,
        timestamp: new Date(),
        status: 'sending' as MessageStatus,
        conversation_id: request.conversation_id || currentConversation?.id || '',
      };

      // Добавляем сообщение пользователя в список
      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);

      if (request.stream) {
        // Потоковый режим - используем SSE
        await handleStreamingMessage(request, userMessage);
      } else {
        // Обычный режим - один запрос
        await handleDirectMessage(request, userMessage);
      }

    } catch (err: any) {
      setErrorWithTimeout(err.message || 'Ошибка отправки сообщения');
      
      // Обновляем статус сообщения на ошибку
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'error' as MessageStatus }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [currentConversation?.id, setErrorWithTimeout, handleDirectMessage, handleStreamingMessage]);

  const value: ChatContextType = {
    // Состояние
    currentConversation,
    conversations,
    messages,
    isLoading,
    isStreaming,
    error,
    
    // Действия
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