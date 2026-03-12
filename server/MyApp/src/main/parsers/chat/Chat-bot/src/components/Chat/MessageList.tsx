import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Fade,
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ThumbUp as LikeIcon,
  ThumbDown as DislikeIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Message, MessageRole, MessageType, MessageStatus } from '../../types/chat';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isStreaming?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onLikeMessage?: (messageId: string) => void;
  onDislikeMessage?: (messageId: string) => void;
  onCopyMessage?: (content: string) => void;
  className?: string;
  autoScroll?: boolean;
  showTimestamps?: boolean;
  enableReactions?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading = false,
  isStreaming = false,
  onEditMessage,
  onDeleteMessage,
  onLikeMessage,
  onDislikeMessage,
  onCopyMessage,
  className,
  autoScroll = true,
  showTimestamps = true,
  enableReactions = true,
}) => {
  const { user: currentUser } = useAuth();
  const { isDark } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    message: Message;
    anchorEl: HTMLElement;
  } | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Автопрокрутка к новым сообщениям
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  // Обработчик контекстного меню
  const handleContextMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setContextMenu({
      message,
      anchorEl: event.currentTarget as HTMLElement,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Обработчик копирования сообщения
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      // Можно показать toast уведомление
      console.log('Message copied to clipboard');
    });
    onCopyMessage?.(content);
    handleCloseContextMenu();
  };

  // Обработчик начала редактирования
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    handleCloseContextMenu();
  };

  // Обработчик сохранения редактирования
  const handleSaveEdit = () => {
    if (editingMessageId && editContent.trim()) {
      onEditMessage?.(editingMessageId, editContent.trim());
    }
    setEditingMessageId(null);
    setEditContent('');
  };

  // Обработчик отмены редактирования
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  // Обработчик удаления сообщения
  const handleDeleteMessage = (messageId: string) => {
    onDeleteMessage?.(messageId);
    handleCloseContextMenu();
  };

  // Обработчик лайка/дизлайка
  const handleLike = (messageId: string) => {
    onLikeMessage?.(messageId);
  };

  const handleDislike = (messageId: string) => {
    onDislikeMessage?.(messageId);
  };

  // Форматирование времени
  const formatMessageTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ru,
    });
  };

  // Получение аватара для сообщения
  const getMessageAvatar = (message: Message) => {
    if (message.role === MessageRole.ASSISTANT) {
      return <BotIcon />;
    }
    return <UserIcon />;
  };

  // Получение цвета аватара
  const getAvatarColor = (message: Message) => {
    if (message.role === MessageRole.ASSISTANT) {
      return 'primary.main';
    }
    return 'secondary.main';
  };

  // Получение статуса сообщения
  const getStatusIcon = (message: Message) => {
    switch (message.status) {
      case MessageStatus.SENDING:
        return <CircularProgress size={12} />;
      case MessageStatus.SENT:
        return <CheckIcon sx={{ fontSize: 12, color: 'success.main' }} />;
      case MessageStatus.ERROR:
        return <ErrorIcon sx={{ fontSize: 12, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  // Проверка, можно ли редактировать сообщение
  const canEditMessage = (message: Message): boolean => {
    return (
      message.role === MessageRole.USER &&
      onEditMessage !== undefined &&
      message.status !== MessageStatus.SENDING
    );
  };

  // Проверка, можно ли удалить сообщение
  const canDeleteMessage = (message: Message): boolean => {
    return (
      onDeleteMessage !== undefined &&
      message.status !== MessageStatus.SENDING
    );
  };

  // Рендер сообщения
  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === MessageRole.USER;
    const isAssistant = message.role === MessageRole.ASSISTANT;
    const isStreamingMessage = isAssistant && !message.complete && isStreaming;
    const isEditing = editingMessageId === message.id;

    return (
      <ListItem
        key={message.id}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          px: 2,
          py: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        onContextMenu={(e) => handleContextMenu(e, message)}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 1,
            maxWidth: '80%',
            width: '100%',
          }}
        >
          {/* Аватар */}
          <Tooltip
            title={isUser ? 'Вы' : 'Ассистент'}
            placement={isUser ? 'left' : 'right'}
          >
            <Avatar
              sx={{
                bgcolor: getAvatarColor(message),
                width: 32,
                height: 32,
                mt: 0.5,
              }}
            >
              {getMessageAvatar(message)}
            </Avatar>
          </Tooltip>

          {/* Контент сообщения */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              backgroundColor: isUser
                ? 'primary.main'
                : isDark
                ? 'grey.800'
                : 'grey.100',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              position: 'relative',
              minWidth: 120,
              maxWidth: '100%',
              wordBreak: 'break-word',
            }}
          >
            {/* Мета-информация */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              {showTimestamps && (
                <Typography
                  variant="caption"
                  sx={{
                    color: isUser ? 'primary.contrastText' : 'text.secondary',
                    opacity: 0.8,
                  }}
                >
                  {formatMessageTime(message.timestamp)}
                </Typography>
              )}

              {/* Статус сообщения */}
              {isUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getStatusIcon(message)}
                </Box>
              )}
            </Box>

            {/* Контент */}
            {isEditing ? (
              <Box>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSaveEdit();
                    } else if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }}
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                  }}
                  autoFocus
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <IconButton
                    size="small"
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim()}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelEdit}>
                    <ErrorIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5,
                }}
              >
                {message.content}
                {isStreamingMessage && (
                  <Box
                    component="span"
                    sx={{
                      animation: 'blink 1s infinite',
                      '@keyframes blink': {
                        '0%, 50%': { opacity: 1 },
                        '51%, 100%': { opacity: 0 },
                      },
                    }}
                  >
                    ▋
                  </Box>
                )}
              </Typography>
            )}

            {/* Метаданные */}
            {message.metadata && (
              <Box sx={{ mt: 1 }}>
                {message.metadata.isInappropriate && (
                  <Chip
                    icon={<WarningIcon />}
                    label="Контент отфильтрован"
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                )}
                {message.metadata.tokens && (
                  <Tooltip title="Количество токенов">
                    <Chip
                      label={`${message.metadata.tokens} токенов`}
                      size="small"
                      variant="outlined"
                      sx={{ ml: 0.5 }}
                    />
                  </Tooltip>
                )}
              </Box>
            )}

            {/* Реакции */}
            {enableReactions && !isEditing && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  mt: 1,
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                }}
              >
                <Tooltip title="Нравится">
                  <IconButton
                    size="small"
                    onClick={() => handleLike(message.id)}
                    sx={{
                      color: 'success.main',
                      '&:hover': { backgroundColor: 'success.light' },
                    }}
                  >
                    <LikeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Не нравится">
                  <IconButton
                    size="small"
                    onClick={() => handleDislike(message.id)}
                    sx={{
                      color: 'error.main',
                      '&:hover': { backgroundColor: 'error.light' },
                    }}
                  >
                    <DislikeIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
          </Paper>

          {/* Кнопка меню */}
          {(canEditMessage(message) || canDeleteMessage(message)) && !isEditing && (
            <IconButton
              size="small"
              onClick={(e) => handleContextMenu(e, message)}
              sx={{
                opacity: 0,
                transition: 'opacity 0.2s',
                [`&:hover, .message-item:hover &`]: {
                  opacity: 1,
                },
              }}
              className="message-item"
            >
              <MoreIcon />
            </IconButton>
          )}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box
      className={className}
      sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: 'background.default',
        position: 'relative',
      }}
    >
      {/* Список сообщений */}
        <List
            ref={listRef as unknown as React.RefObject<HTMLUListElement>}
            sx={{
                py: 1,
                minHeight: '100%',
            }}
        >

        {messages.length === 0 && !isLoading && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: 'text.secondary',
            }}
          >
            <BotIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              Начните диалог
            </Typography>
            <Typography variant="body2">
              Отправьте сообщение, чтобы начать общение с AI-ассистентом
            </Typography>
          </Box>
        )}

        {messages.map((message, index) => renderMessage(message, index))}

        {/* Индикатор загрузки */}
        {isLoading && (
          <ListItem
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 2,
            }}
          >
            <Fade in={isLoading} timeout={500}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'action.hover',
                }}
              >
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  AI думает...
                </Typography>
              </Box>
            </Fade>
          </ListItem>
        )}

        {/* Элемент для автопрокрутки */}
        <div ref={messagesEndRef} />
      </List>

      {/* Контекстное меню */}
      <Menu
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        anchorEl={contextMenu?.anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem
          onClick={() => handleCopyMessage(contextMenu?.message.content || '')}
        >
          <CopyIcon sx={{ mr: 1 }} />
          Копировать
        </MenuItem>

        {contextMenu?.message && canEditMessage(contextMenu.message) && (
          <MenuItem onClick={() => handleStartEdit(contextMenu.message)}>
            <EditIcon sx={{ mr: 1 }} />
            Редактировать
          </MenuItem>
        )}

        {contextMenu?.message && canDeleteMessage(contextMenu.message) && (
          <MenuItem
            onClick={() => handleDeleteMessage(contextMenu.message.id)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} />
            Удалить
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

// Компонент для отображения системных сообщений
interface SystemMessageProps {
  message: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export const SystemMessage: React.FC<SystemMessageProps> = ({
  message,
  type = 'info',
}) => {
  const getSeverity = () => {
    switch (type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Alert severity={getSeverity()} sx={{ borderRadius: 2 }}>
        {message}
      </Alert>
    </Box>
  );
};

export default MessageList;