import React, { useState } from 'react';
import {
	Box,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	ListItemButton,
	Typography,
	IconButton,
	TextField,
	Divider,
	Chip,
	Menu,
	MenuItem,
	CircularProgress,
	Tooltip,
} from '@mui/material';
import {
	Add as AddIcon,
	Search as SearchIcon,
	Delete as DeleteIcon,
	Archive as ArchiveIcon,
	Pin as PinIcon,
	Chat as ChatIcon,
	Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useChat } from '../../hooks/useChat';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Conversation } from '@server/app/models/chat';

interface ConversationSidebarProps {
	currentConversation: Conversation;
	onSelectConversation: (conversationId: string) => void;
	onDeleteConversation: (conversationId: string) => void;
	onRefresh: () => void;
	onCreateNew: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
	currentConversation,
	onSelectConversation,
	onDeleteConversation,
	onRefresh,
	onCreateNew,
}) => {
	const { conversations, isLoading } = useChat();
	const [searchTerm, setSearchTerm] = useState('');
	const [contextMenu, setContextMenu] = useState<{
		conversation: Conversation;
		anchorEl: HTMLElement;
	} | null>(null);
	const filteredConversations = conversations.filter(conversation =>
		conversation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
		conversation.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
	);
	const pinnedConversations = filteredConversations.filter(conv => conv.is_pinned);
	const unpinnedConversations = filteredConversations.filter(conv => !conv.is_pinned);

	const handleContextMenu = (event: React.MouseEvent, conversation: Conversation) => {
		event.preventDefault();
		event.stopPropagation();
		setContextMenu({
			conversation,
			anchorEl: event.currentTarget as HTMLElement,
		});
	};

	const handleCloseContextMenu = () => {
		setContextMenu(null);
	};

	const handleDeleteConversation = () => {
		if (contextMenu) {
			onDeleteConversation(contextMenu.conversation.id);
			handleCloseContextMenu();
		}
	};

	return (
		<Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ p: 2, pb: 1 }}>
				<Typography variant="h6" component="div" gutterBottom>
					Диалоги
				</Typography>
				<TextField
					fullWidth
					size="small"
					placeholder="Поиск диалогов..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					slotProps={{
						input: {
							startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
						},
					}}
					sx={{ mb: 2 }}
				/>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Новый диалог">
						<IconButton onClick={onCreateNew} size="small">
							<AddIcon />
						</IconButton>
					</Tooltip>
					
					<Tooltip title="Обновить">
						<IconButton onClick={onRefresh} size="small" disabled={isLoading}>
							{isLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
						</IconButton>
					</Tooltip>
				</Box>
			</Box>
			<Divider />
			<Box sx={{ flex: 1, overflow: 'auto' }}>
				{isLoading && conversations.length === 0 ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
						<CircularProgress />
					</Box>
				) : filteredConversations.length === 0 ? (
					<Box sx={{ p: 3, textAlign: 'center' }}>
						<ChatIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
						<Typography variant="body2" color="text.secondary">
							{searchTerm ? 'Диалоги не найдены' : 'Нет диалогов'}
						</Typography>
					</Box>
				) : (
					<List dense>
						{pinnedConversations.length > 0 && (
							<>
								<ListItem>
									<Typography variant="caption" color="text.secondary">
										ЗАКРЕПЛЕННЫЕ
									</Typography>
								</ListItem>
								{pinnedConversations.map((conversation) => (
									<ConversationListItem
										key={conversation.id}
										conversation={conversation}
										isSelected={currentConversation?.id === conversation.id}
										onSelect={onSelectConversation}
										onContextMenu={handleContextMenu}
									/>
								))}
								<Divider sx={{ my: 1 }} />
							</>
						)}
						{unpinnedConversations.length > 0 && (
							<>
								{pinnedConversations.length > 0 && (
									<ListItem>
										<Typography variant="caption" color="text.secondary">
											ВСЕ ДИАЛОГИ
										</Typography>
									</ListItem>
								)}
								{unpinnedConversations.map((conversation) => (
									<ConversationListItem
										key={conversation.id}
										conversation={conversation}
										isSelected={currentConversation?.id === conversation.id}
										onSelect={onSelectConversation}
										onContextMenu={handleContextMenu}
									/>
								))}
							</>
						)}
					</List>
				)}
			</Box>
			<Menu
				open={Boolean(contextMenu)}
				onClose={handleCloseContextMenu}
				anchorEl={contextMenu?.anchorEl}
			>
				<MenuItem onClick={handleDeleteConversation}>
					<ListItemIcon>
						<DeleteIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Удалить</ListItemText>
				</MenuItem>
				<MenuItem onClick={handleCloseContextMenu}>
					<ListItemIcon>
						<ArchiveIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText>Архивировать</ListItemText>
				</MenuItem>
			</Menu>
		</Box>
	);
};

interface ConversationListItemProps {
	conversation: Conversation;
	isSelected: boolean;
	onSelect: (conversationId: string) => void;
	onContextMenu: (event: React.MouseEvent, conversation: Conversation) => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({
	conversation,
	isSelected,
	onSelect,
	onContextMenu,
}) => {
	const formatTime = (date: Date) => {
		return formatDistanceToNow(new Date(date), {
			addSuffix: true,
			locale: ru,
		});
	};

	const truncateText = (text: string, maxLength: number = 50) => {
		if (text.length <= maxLength) {return text;}
		return text.substring(0, maxLength) + '...';
	};

	return (
		<ListItemButton
			selected={isSelected}
			onClick={() => onSelect(conversation.id)}
			onContextMenu={(e) => onContextMenu(e, conversation)}
			sx={{
				'&.Mui-selected': {
					backgroundColor: 'primary.light',
					'&:hover': {
						backgroundColor: 'primary.light',
					},
				},
			}}
		>
			<ListItemIcon>
				<ChatIcon color={isSelected ? 'primary' : 'action'} />
			</ListItemIcon>
			<ListItemText
				primary={
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography variant="body2" noWrap>
							{conversation.title || 'Без названия'}
						</Typography>
						{conversation.is_pinned && (
							<PinIcon sx={{ fontSize: 16, color: 'primary.main' }} />
						)}
					</Box>
				}
				secondary={
					<Box>
						{conversation.last_message && (
							<Typography variant="caption" noWrap sx={{ display: 'block' }}>
								{truncateText(conversation.last_message, 40)}
							</Typography>
						)}
						<Typography variant="caption" color="text.secondary">
							{formatTime(conversation.updated_at)}
						</Typography>
					</Box>
				}
			/>
			{conversation.tags && conversation.tags.length > 0 && (
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
					{conversation.tags.slice(0, 2).map((tag, index) => (
						<Chip
							key={index}
							label={tag}
							size="small"
							variant="outlined"
							sx={{ height: 20, fontSize: '0.6rem' }}
						/>
					))}
				</Box>
			)}
		</ListItemButton>
	);
};