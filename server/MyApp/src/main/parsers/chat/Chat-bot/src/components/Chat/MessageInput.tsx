import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Button,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Divider,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachIcon,
  Mood as EmojiIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Code as CodeIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatListBulleted as ListIcon,
  FormatListNumbered as NumberedListIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Clear as ClearIcon,
  SmartToy as AIIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  maxLength?: number;
  enableAttachments?: boolean;
  enableVoice?: boolean;
  enableFormatting?: boolean;
  enableAICommands?: boolean;
  autoFocus?: boolean;
  className?: string;
}

interface Suggestion {
  text: string;
  description?: string;
  icon?: React.ReactNode;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = 'Введите сообщение...',
  disabled = false,
  isLoading = false,
  maxLength = 4000,
  enableAttachments = true,
  enableVoice = false,
  enableFormatting = true,
  enableAICommands = true,
  autoFocus = true,
  className,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [formatMenuAnchor, setFormatMenuAnchor] = useState<null | HTMLElement>(null);
  const [aiCommandsAnchor, setAiCommandsAnchor] = useState<null | HTMLElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionTimeoutRef = useRef<NodeJS.Timeout>();

  // AI команды для быстрого доступа
  const aiCommands: Suggestion[] = [
    {
      text: '/summarize',
      description: 'Суммаризировать предыдущие сообщения',
      icon: <AIIcon />,
    },
    {
      text: '/translate',
      description: 'Перевести текст',
      icon: <AIIcon />,
    },
    {
      text: '/explain',
      description: 'Объяснить понятие',
      icon: <AIIcon />,
    },
    {
      text: '/code',
      description: 'Написать код',
      icon: <CodeIcon />,
    },
    {
      text: '/help',
      description: 'Показать справку по командам',
      icon: <AIIcon />,
    },
    {
      text: '/clear',
      description: 'Очистить историю',
      icon: <ClearIcon />,
    },
  ];

  // Форматирование текста
  const formattingOptions = [
    {
      name: 'Жирный',
      symbol: '**',
      icon: <BoldIcon />,
      example: '**жирный текст**',
    },
    {
      name: 'Курсив',
      symbol: '*',
      icon: <ItalicIcon />,
      example: '*курсивный текст*',
    },
    {
      name: 'Список',
      symbol: '- ',
      icon: <ListIcon />,
      example: '- пункт списка',
    },
    {
      name: 'Нумерованный список',
      symbol: '1. ',
      icon: <NumberedListIcon />,
      example: '1. первый пункт',
    },
    {
      name: 'Код',
      symbol: '`',
      icon: <CodeIcon />,
      example: '`код`',
    },
    {
      name: 'Ссылка',
      symbol: '[текст](url)',
      icon: <LinkIcon />,
      example: '[Google](https://google.com)',
    },
  ];

  // Обработчик изменения сообщения
  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = event.target.value;
    
    if (newMessage.length <= maxLength) {
      setMessage(newMessage);
      
      // Отправка индикатора набора текста
      if (onTyping) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          onTyping(false);
        }, 1000);
        
        onTyping(true);
      }

      // Показ подсказок для AI команд
      if (enableAICommands && newMessage.startsWith('/')) {
        clearTimeout(suggestionTimeoutRef.current);
        suggestionTimeoutRef.current = setTimeout(() => {
          const command = newMessage.slice(1).toLowerCase();
          const filteredCommands = aiCommands.filter(cmd =>
            cmd.text.toLowerCase().includes(command)
          );
          setSuggestions(filteredCommands);
          setShowSuggestions(filteredCommands.length > 0);
          setSuggestionIndex(0);
        }, 300);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(() => {
    if (message.trim() && !disabled && !isLoading) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      setShowSuggestions(false);
      
      if (onTyping) {
        setIsTyping(false);
        onTyping(false);
      }

      // Фокус на поле ввода после отправки
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [message, attachments, disabled, isLoading, onSendMessage, onTyping]);

  // Обработчик нажатия клавиш
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (event.key === 'Tab' && suggestions.length > 0) {
        event.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      } else if (event.key === 'Enter' && suggestions.length > 0) {
        event.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Применение подсказки
  const applySuggestion = (suggestion: Suggestion) => {
    setMessage(suggestion.text + ' ');
    setShowSuggestions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Обработчик прикрепления файлов
  const handleAttachFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files.slice(0, 5 - prev.length)]);
    }
    // Сбрасываем значение input для возможности выбора тех же файлов снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Удаление прикрепленного файла
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Добавление форматирования
  const handleAddFormatting = (symbol: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    
    let newMessage = '';
    let newCursorPos = 0;

    if (symbol === '`' || symbol === '*' || symbol === '**') {
      // Обрамление выделенного текста
      newMessage = message.substring(0, start) + symbol + selectedText + symbol + message.substring(end);
      newCursorPos = end + symbol.length * 2;
    } else if (symbol === '- ' || symbol === '1. ') {
      // Добавление в начало строки
      const lines = message.split('\n');
      const currentLineIndex = message.substring(0, start).split('\n').length - 1;
      lines[currentLineIndex] = symbol + lines[currentLineIndex];
      newMessage = lines.join('\n');
      newCursorPos = start + symbol.length;
    } else if (symbol === '[текст](url)') {
      // Вставка шаблона ссылки
      newMessage = message.substring(0, start) + '[текст](url)' + message.substring(end);
      newCursorPos = start + 1; // Курсор после "["
    }

    setMessage(newMessage);
    setFormatMenuAnchor(null);

    // Восстановление позиции курсора
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Обработчик голосового ввода
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается вашим браузером');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map(result => result.transcript)
        .join('');

      setMessage(prev => prev + transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.start();
  };

  // Авто-размер текстового поля
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(suggestionTimeoutRef.current);
    };
  }, []);

  const charactersLeft = maxLength - message.length;
  const isNearLimit = charactersLeft < 100;
  const isOverLimit = charactersLeft < 0;

  return (
    <Box className={className} sx={{ position: 'relative' }}>
      {/* Прикрепленные файлы */}
      {attachments.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {attachments.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => handleRemoveAttachment(index)}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}

      <Paper
        elevation={2}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          p: 1,
          gap: 1,
          borderRadius: 2,
          border: isOverLimit ? '1px solid' : 'none',
          borderColor: isOverLimit ? 'error.main' : 'transparent',
          backgroundColor: isDark ? 'grey.900' : 'background.paper',
        }}
      >
        {/* Кнопки действий */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {/* Прикрепление файлов */}
          {enableAttachments && (
            <Tooltip title="Прикрепить файл">
              <IconButton
                size="small"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || attachments.length >= 5}
              >
                <AttachIcon />
              </IconButton>
            </Tooltip>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAttachFiles}
            multiple
            accept="*/*"
            style={{ display: 'none' }}
          />

          {/* Голосовой ввод */}
          {enableVoice && (
            <Tooltip title={isRecording ? 'Остановить запись' : 'Голосовой ввод'}>
              <IconButton
                size="small"
                onClick={handleVoiceInput}
                disabled={disabled}
                color={isRecording ? 'error' : 'default'}
              >
                {isRecording ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
          )}

          {/* Форматирование */}
          {enableFormatting && (
            <Tooltip title="Форматирование">
              <IconButton
                size="small"
                onClick={(e) => setFormatMenuAnchor(e.currentTarget)}
                disabled={disabled}
              >
                <BoldIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* AI команды */}
          {enableAICommands && (
            <Tooltip title="AI команды">
              <IconButton
                size="small"
                onClick={(e) => setAiCommandsAnchor(e.currentTarget)}
                disabled={disabled}
              >
                <AIIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Поле ввода сообщения */}
        <TextField
          multiline
          maxRows={4}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          inputRef={textareaRef}
          autoFocus={autoFocus}
          fullWidth
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: '14px',
              lineHeight: 1.4,
              maxHeight: 120,
              overflow: 'auto',
            },
          }}
          sx={{
            flex: 1,
            '& .MuiInputBase-root': {
              padding: '8px 0',
            },
          }}
        />

        {/* Счетчик символов */}
        {isNearLimit && (
          <Typography
            variant="caption"
            color={isOverLimit ? 'error' : 'text.secondary'}
            sx={{ position: 'absolute', top: -20, right: 50 }}
          >
            {charactersLeft}
          </Typography>
        )}

        {/* Кнопка отправки */}
        <Tooltip title="Отправить (Enter)">
          <span>
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={disabled || isLoading || !message.trim() || isOverLimit}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'action.disabled',
                  color: 'action.disabledBackground',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Paper>

      {/* Подсказки AI команд */}
      {showSuggestions && suggestions.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            mb: 1,
            maxHeight: 200,
            overflow: 'auto',
            zIndex: 10,
          }}
        >
          <List dense>
            {suggestions.map((suggestion, index) => (
              <ListItem
                key={suggestion.text}
                button
                selected={index === suggestionIndex}
                onClick={() => applySuggestion(suggestion)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {suggestion.icon}
                </ListItemIcon>
                <ListItemText
                  primary={suggestion.text}
                  secondary={suggestion.description}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Меню форматирования */}
      <Menu
        anchorEl={formatMenuAnchor}
        open={Boolean(formatMenuAnchor)}
        onClose={() => setFormatMenuAnchor(null)}
      >
        {formattingOptions.map((option) => (
          <MenuItem
            key={option.name}
            onClick={() => handleAddFormatting(option.symbol)}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText
              primary={option.name}
              secondary={option.example}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Меню AI команд */}
      <Menu
        anchorEl={aiCommandsAnchor}
        open={Boolean(aiCommandsAnchor)}
        onClose={() => setAiCommandsAnchor(null)}
      >
        {aiCommands.map((command) => (
          <MenuItem
            key={command.text}
            onClick={() => {
              setMessage(prev => prev + command.text + ' ');
              setAiCommandsAnchor(null);
            }}
          >
            <ListItemIcon>{command.icon}</ListItemIcon>
            <ListItemText
              primary={command.text}
              secondary={command.description}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default MessageInput;