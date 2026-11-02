import React, { useEffect, useMemo, useRef, useState } from 'react';
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
	Error as ErrorIcon
} from '@mui/icons-material';
import { useTheme } from '../../hooks/useTheme';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';
import { Message } from '@server/app/models/chat';
import { MessageRole, MessageStatus } from '@server/app/schemas/auth';

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

const markdown = new MarkdownIt({
	html: false,
	linkify: true,
	breaks: true,
	maxNesting: 50,
});

const DANGEROUS_URL = /^\s*(javascript|data|vbscript|file|blob):/i;
const EVENT_HANDLER_ATTR = /\son\w+\s*=/i;

const SANITIZE_CONFIG = {
	ALLOWED_TAGS: [
		'p', 'br', 'hr', 'strong', 'em', 's', 'del', 'code', 'pre', 'span', 'div',
		'blockquote', 'ul', 'ol', 'li', 'a',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'table', 'thead', 'tbody', 'tr', 'th', 'td',
		'img', 'button',
	],
	FORBID_TAGS: [
		'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed',
		'applet', 'form', 'input', 'textarea', 'select', 'option',
		'link', 'meta', 'base', 'svg', 'math', 'template', 'noscript',
	],
	FORBID_ATTR: ['formaction', 'srcdoc', 'xlink:href'],
	ADD_ATTR: ['target'],
	ALLOW_DATA_ATTR: true,
};

markdown.validateLink = (url: string): boolean => {
	if (DANGEROUS_URL.test(url)) {
		return false;
	}
	return !EVENT_HANDLER_ATTR.test(url);
};

markdown.renderer.rules.fence = (tokens, idx) => {
	const token = tokens[idx];
	const lang = (token.info || '').trim().split(/\s+/)[0] || '';
	const code = token.content;
	const hasLang = Boolean(lang && hljs.getLanguage(lang));

	const highlighted = hasLang
		? hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
		: markdown.utils.escapeHtml(code);

	const encoded = encodeURIComponent(code);

	return (
		'<div class="md-code">' +
			'<div class="md-code__head">' +
				`<span class="md-code__lang">${markdown.utils.escapeHtml(lang || 'text')}</span>` +
				`<button type="button" class="md-code__copy" data-code="${encoded}">Копировать</button>` +
			'</div>' +
			`<pre class="md-code__pre"><code class="hljs">${highlighted}</code></pre>` +
		'</div>'
	);
};

markdown.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
	tokens[idx].attrSet('target', '_blank');
	tokens[idx].attrSet('rel', 'noopener noreferrer');
	return self.renderToken(tokens, idx, options);
};

interface MarkdownContentProps {
	content: string;
	isStreaming?: boolean;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({
	content,
	isStreaming = false,
}) => {
	const rawHtml = useMemo(() => {
		const rendered = markdown.render(content);
		return isStreaming ? `${rendered}<span class="md-cursor">▋</span>` : rendered;
	}, [content, isStreaming]);
	const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
		const button = (event.target as HTMLElement).closest('.md-code__copy') as HTMLButtonElement | null;
		if (!button) {return;}

		const code = decodeURIComponent(button.dataset.code || '');
		navigator.clipboard.writeText(code).then(() => {
			button.textContent = 'Скопировано';
			setTimeout(() => {
				button.textContent = 'Копировать';
			}, 1500);
		});
	};

	return (
		<Box
			onClick={handleClick}
			sx={{
				lineHeight: 1.5,
				wordBreak: 'break-word',
				'& > :first-of-type': { mt: 0 },
				'& > :last-of-type': { mb: 0 },
				'& p': { my: 0.5 },
				'& ul, & ol': { my: 0.5, pl: 3 },
				'& li': { my: 0.25 },
				'& a': { color: 'inherit', textDecoration: 'underline' },
				'& blockquote': {
					borderLeft: '3px solid',
					borderColor: 'divider',
					pl: 1.5,
					my: 1,
					opacity: 0.85,
				},
				'& :not(pre) > code': {
					px: 0.5,
					py: 0.2,
					borderRadius: 0.5,
					fontFamily: 'monospace',
					fontSize: '0.875em',
					backgroundColor: 'action.selected',
				},
				'& table': { borderCollapse: 'collapse', my: 1 },
				'& th, & td': { border: '1px solid', borderColor: 'divider', px: 1, py: 0.5 },
				'& .md-code': {
					my: 1,
					borderRadius: 1,
					overflow: 'hidden',
					backgroundColor: '#0d1117',
					border: '1px solid',
					borderColor: 'divider',
				},
				'& .md-code__head': {
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					px: 1.5,
					py: 0.5,
					backgroundColor: '#161b22',
					color: '#c9d1d9',
					fontSize: 12,
				},
				'& .md-code__lang': { textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 },
				'& .md-code__copy': {
					border: 'none',
					background: 'transparent',
					color: '#c9d1d9',
					cursor: 'pointer',
					fontSize: 12,
					fontFamily: 'inherit',
					'&:hover': { color: '#ffffff' },
				},
				'& .md-code__pre': { margin: 0, p: 1.5, overflowX: 'auto' },
				'& .hljs': { color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.85em' },
				'& .md-cursor': {
					animation: 'blink 1s infinite',
					'@keyframes blink': {
						'0%, 50%': { opacity: 1 },
						'51%, 100%': { opacity: 0 },
					},
				},
				'& .hljs-comment, & .hljs-quote': { color: '#8b949e', fontStyle: 'italic' },
				'& .hljs-keyword, & .hljs-selector-tag, & .hljs-literal, & .hljs-type': { color: '#ff7b72' },
				'& .hljs-string, & .hljs-meta .hljs-string, & .hljs-regexp': { color: '#a5d6ff' },
				'& .hljs-number, & .hljs-symbol, & .hljs-bullet': { color: '#79c0ff' },
				'& .hljs-title, & .hljs-title.class_, & .hljs-title.function_, & .hljs-section': { color: '#d2a8ff' },
				'& .hljs-attr, & .hljs-attribute, & .hljs-variable, & .hljs-template-variable': { color: '#79c0ff' },
				'& .hljs-built_in, & .hljs-builtin-name': { color: '#ffa657' },
				'& .hljs-name, & .hljs-tag': { color: '#7ee787' },
				'& .hljs-meta': { color: '#8b949e' },
				'& .hljs-deletion': { color: '#ffdcd7', backgroundColor: '#67060c' },
				'& .hljs-addition': { color: '#aff5b4', backgroundColor: '#033a16' },
				'& .hljs-emphasis': { fontStyle: 'italic' },
				'& .hljs-strong': { fontWeight: 'bold' },
			}}
		>
			<Box
				component="div"
				dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG) }}
			/>
		</Box>
	);
};

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
	const { isDark } = useTheme();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [contextMenu, setContextMenu] = useState<{
		message: Message;
		anchorEl: HTMLElement;
	} | null>(null);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');

	useEffect(() => {
		if (autoScroll && messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages, autoScroll]);

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

	const handleCopyMessage = (content: string) => {
		navigator.clipboard.writeText(content).then(() => {
			console.log('Message copied to clipboard');
		});
		onCopyMessage?.(content);
		handleCloseContextMenu();
	};

	const handleStartEdit = (message: Message) => {
		setEditingMessageId(message.id);
		setEditContent(message.content);
		handleCloseContextMenu();
	};

	const handleSaveEdit = () => {
		if (editingMessageId && editContent.trim()) {
			onEditMessage?.(editingMessageId, editContent.trim());
		}
		setEditingMessageId(null);
		setEditContent('');
	};

	const handleCancelEdit = () => {
		setEditingMessageId(null);
		setEditContent('');
	};

	const handleDeleteMessage = (messageId: string) => {
		onDeleteMessage?.(messageId);
		handleCloseContextMenu();
	};

	const handleLike = (messageId: string) => {
		onLikeMessage?.(messageId);
	};

	const handleDislike = (messageId: string) => {
		onDislikeMessage?.(messageId);
	};

	const formatMessageTime = (timestamp: Date) => {
		return formatDistanceToNow(new Date(timestamp), {
			addSuffix: true,
			locale: ru,
		});
	};

	const getMessageAvatar = (message: Message) => {
		if (message.role === MessageRole.ASSISTANT) {
			return <BotIcon />;
		}
		return <UserIcon />;
	};

	const getAvatarColor = (message: Message) => {
		if (message.role === MessageRole.ASSISTANT) {
			return 'primary.main';
		}
		return 'secondary.main';
	};

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

	const canEditMessage = (message: Message): boolean => {
		return (
			message.role === MessageRole.USER &&
			onEditMessage !== undefined &&
			message.status !== MessageStatus.SENDING
		);
	};

	const canDeleteMessage = (message: Message): boolean => {
		return (
			onDeleteMessage !== undefined &&
			message.status !== MessageStatus.SENDING
		);
	};

	const renderMessage = (message: Message) => {
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
									{formatMessageTime(message.created_at)}
								</Typography>
							)}
							{isUser && (
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
									{getStatusIcon(message)}
								</Box>
							)}
						</Box>
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
						) : isAssistant ? (
							<MarkdownContent content={message.content} isStreaming={isStreamingMessage} />
						) : (
							<Typography
								variant="body1"
								sx={{
									whiteSpace: 'pre-wrap',
									lineHeight: 1.5,
								}}
							>
								{message.content}
							</Typography>
						)}
						{(!message.moderation_passed || message.usage_data?.total_tokens) && (
							<Box sx={{ mt: 1 }}>
								{!message.moderation_passed && (
									<Chip
										icon={<WarningIcon />}
										label="Контент отфильтрован"
										size="small"
										color="warning"
										variant="outlined"
									/>
								)}
								{message.usage_data?.total_tokens && (
									<Tooltip title="Количество токенов">
										<Chip
											label={`${message.usage_data.total_tokens} токенов`}
											size="small"
											variant="outlined"
											sx={{ ml: 0.5 }}
										/>
									</Tooltip>
								)}
							</Box>
						)}
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
				{messages.map((message) => renderMessage(message))}
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
				<div ref={messagesEndRef} />
			</List>
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