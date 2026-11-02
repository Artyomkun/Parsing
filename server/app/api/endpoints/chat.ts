import {type Response, Router} from 'express';
import {randomUUID} from 'node:crypto';
import mongoose from 'mongoose';
import {z} from 'zod';

import {AuthenticatedRequest, Permission, requirePermission} from '../../core/rbac';
import {RedisManager} from '../../core/redis';
import {authMiddleware} from '../../core/security';
import {getConversationModel, getMessageModel} from '../../models/chat';
import { SecurityService } from '../../models/moderation';
import {CreateConversationSchema, ListConversationsQuerySchema, SearchQuerySchema, SendMessageSchema, UpdateConversationSchema} from '../../schemas/auth';
import { MCP_Client } from '../../services/mcp_client';

export const router = Router();

async function buildPromptWithHistory(conversationId: string, currentMessage: string): Promise<string> {
    if (!conversationId) {return currentMessage;}

    const history = await getMessageModel().find({conversation_id: conversationId}).sort({created_at: 1}).limit(20).lean();

    if (history.length === 0) {return currentMessage;}

    const lines = history.slice(-10).map((m) => {
        const role = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'Assistant' : 'System';
        return `${role}: ${m.content}`;
    });

    lines.push(`User: ${currentMessage}`);
    return lines.join('\n\n');
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

router.post(
    '/conversations', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({detail: 'Authentication required'});}

        const parsed = CreateConversationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const conversationId = randomUUID();
            const now = new Date();

            const conversation = await getConversationModel().create({
                id: conversationId,
                user_id: user.id,
                title: parsed.data.title ?? 'Новый чат',
                conversation_type: parsed.data.conversation_type,
                tags: parsed.data.tags,
                is_pinned: false,
                is_archived: false,
                message_count: 0,
                created_at: now,
                updated_at: now,
            });

            await RedisManager.hincrby(`user:${user.id}:stats`, 'conversations_count', 1);

            if (parsed.data.initial_message) {
                await getMessageModel().create({
                    id: randomUUID(),
                    conversation_id: conversationId,
                    user_id: user.id,
                    content: parsed.data.initial_message,
                    role: 'user',
                    message_type: 'text',
                    status: 'sent',
                    moderation_passed: true,
                    moderation_notes: [],
                    created_at: now,
                    updated_at: now,
                });

                await getConversationModel().updateOne({id: conversationId}, {
                    $inc: {message_count: 1},
                    $set: {
                        last_message: parsed.data.initial_message.slice(0, 100),
                        last_message_at: now,
                    },
                });
            }

            return res.status(201).json({
                success: true,
                data: {conversation: conversation.toObject()},
                message: 'Диалог успешно создан',
            });
        } catch (error) {
            console.error('create_conversation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при создании диалога',
            });
        }
    }
);

router.get(
    '/conversations', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({detail: 'Authentication required'});}

        const parsed = ListConversationsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        const {skip, limit, search, tags, pinned_only, archived_only} = parsed.data;

        try {
            const query: Record<string, unknown> = {user_id: user.id};
            if (archived_only) {
                query.is_archived = true;
            } else {
                query.is_archived = mongoose.trusted({$ne: true});
            }
            if (pinned_only) {
                query.is_pinned = true;
            }
            if (tags) {
                const tagList = Array.isArray(tags) ? tags : [tags];
                const safeTags = tagList.filter((t: string) => typeof t === 'string' && t.length > 0);
                if (safeTags.length > 0) {
                    query.tags = mongoose.trusted({$all: safeTags});
                }
            }
            if (search) {
                const safeSearch = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                query.title = mongoose.trusted({$regex: safeSearch, $options: 'i'});
            }

            const trustedQuery = mongoose.trusted(query);
            const [conversations, total] = await Promise.all([getConversationModel().find(trustedQuery).sort({updated_at: -1}).skip(skip).limit(limit).lean(), getConversationModel().countDocuments(trustedQuery)]);

            await RedisManager.hincrby(`user:${user.id}:stats`, 'conversations_requests', 1);

            return res.json({
                success: true,
                data: {
                    conversations,
                    total,
                    page: Math.floor(skip / limit) + 1,
                    page_size: limit,
                    has_more: skip + limit < total,
                },
                message: 'Диалоги успешно получены',
            });
        } catch (error) {
            console.error('list_conversations error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при получении диалогов',
            });
        }
    }
);

router.get(
    '/conversations/:id', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({detail: 'Authentication required'});}
        const id = String(req.params.id);

        try {
            const conversation = await getConversationModel().findOne({id}).lean();
            if (!conversation) {
                return res.status(404).json({success: false, error: 'Диалог не найден'});
            }
            if (conversation.user_id !== user.id) {
                return res.status(403).json({success: false, error: 'Нет доступа к этому диалогу'});
            }

            const messages = await getMessageModel().find({conversation_id: id}).sort({created_at: 1}).lean();

            await Promise.all([
                RedisManager.hincrby(`conversation:${id}:stats`, 'views_count', 1),
                RedisManager.hset(`user:${user.id}:recent_views`, {[String(id)]: new Date().toISOString()}),
                RedisManager.hincrby(`user:${user.id}:stats`, 'conversation_views', 1),
            ]);

            return res.json({
                success: true,
                data: {...conversation, messages},
                message: 'Диалог успешно получен',
            });
        } catch (error) {
            console.error('get_conversation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при получении диалога',
            });
        }
    }
);

router.put(
    '/conversations/:id', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({detail: 'Authentication required'});}
        const id = String(req.params.id);

        const parsed = UpdateConversationSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const conversation = await getConversationModel().findOne({id}).lean();
            if (!conversation) {
                return res.status(404).json({success: false, error: 'Диалог не найден'});
            }
            if (conversation.user_id !== user.id) {
                return res.status(403).json({success: false, error: 'Нет доступа'});
            }

            const updated = await getConversationModel().findOneAndUpdate({id}, {...parsed.data, updated_at: new Date()}, {new: true}).lean();

            return res.json({
                success: true,
                data: updated,
                message: 'Диалог успешно обновлен',
            });
        } catch (error) {
            console.error('update_conversation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при обновлении диалога',
            });
        }
    }
);

router.delete(
    '/conversations/:id', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({detail: 'Authentication required'});}

        const id = String(req.params.id);

        try {
            const conversation = await getConversationModel().findOne({id}).lean();
            if (!conversation) {
                return res.status(404).json({success: false, error: 'Диалог не найден'});
            }
            if (conversation.user_id !== user.id) {
                return res.status(403).json({success: false, error: 'Нет доступа'});
            }

            await Promise.all([
                getConversationModel().deleteOne({id}),
                getMessageModel().deleteMany({conversation_id: id}),
                RedisManager.delete(`conversation:${id}:messages`, `conversation:${id}:stats`),
            ]);

            return res.json({
                success: true,
                message: 'Диалог успешно удален',
            });
        } catch (error) {
            console.error('delete_conversation error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при удалении диалога',
            });
        }
    }
);

router.post(
    '/message', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const parsed = SendMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        const {message, conversation_id} = parsed.data;

        try {
            const moderation = await SecurityService.moderateContent(message, user.id);
            if (!moderation.is_approved) {
                return res.status(400).json({
                    success: false,
                    error: `Сообщение содержит недопустимый контент: ${(moderation.moderation_notes ?? []).join(', ')}`,
                });
            }

            if (conversation_id) {
                const conversation = await getConversationModel().findOne({id: mongoose.trusted(conversation_id)}) .lean();
                if (!conversation) {
                    return res.status(404).json({success: false, error: 'Диалог не найден'});
                }
                if (conversation.user_id !== user.id) {
                    return res.status(403).json({success: false, error: 'Нет доступа к этому диалогу'});
                }
            }

            const userMessageId = randomUUID();
            const now = new Date();

            await getMessageModel().create({
                id: userMessageId,
                conversation_id: conversation_id ?? '',
                user_id: user.id,
                content: message,
                role: 'user',
                message_type: 'text',
                status: 'sent',
                moderation_passed: moderation.is_approved,
                moderation_notes: moderation.moderation_notes ?? [],
                created_at: now,
                updated_at: now,
            });

            const prompt = await buildPromptWithHistory(conversation_id ?? '', message);
            const responseContent = await MCP_Client.chat(prompt);

            const assistantMessageId = randomUUID();
            const assistantMessage = await getMessageModel().create({
                id: assistantMessageId,
                conversation_id: conversation_id ?? '',
                user_id: user.id,
                content: responseContent,
                role: 'assistant',
                message_type: 'text',
                status: 'sent',
                parent_message_id: userMessageId,
                moderation_passed: true,
                moderation_notes: [],
                usage_data: {
                    prompt_tokens: prompt.split(/\s+/).length,
                    completion_tokens: responseContent.split(/\s+/).length,
                    total_tokens: prompt.split(/\s+/).length + responseContent.split(/\s+/).length,
                    model: 'mcp-local',
                },
                created_at: new Date(),
                updated_at: new Date(),
            });

            if (conversation_id) {
                await getConversationModel().updateOne({id: mongoose.trusted(conversation_id)}, {
                    $inc: {message_count: 2},
                    $set: {
                        last_message: responseContent.slice(0, 100),
                        last_message_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            return res.json({
                success: true,
                data: {
                    message_id: assistantMessageId,
                    conversation_id: conversation_id ?? '',
                    content: responseContent,
                    timestamp: assistantMessage.created_at,
                },
            });
        } catch (error) {
            console.error('send_message error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при отправке сообщения',
            });
        }
    }
);

router.post(
    '/message/stream', authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const parsed = SendMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        const {message, conversation_id} = parsed.data;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        const sendEvent = (event: string, data: Record<string, unknown>) => {
            const encodeValue = (value: unknown): unknown => {
                if (typeof value === 'string') {return escapeHtml(value);}
                if (Array.isArray(value)) {return value.map(encodeValue);}
                if (value !== null && typeof value === 'object') {
                    const encoded: Record<string, unknown> = {};
                    for (const [key, val] of Object.entries(value)) {
                        encoded[key] = encodeValue(val);
                    }
                    return encoded;
                }
                return value;
            };
            res.write(`event: ${escapeHtml(event)}\ndata: ${JSON.stringify(encodeValue(data))}\n\n`);
        };

        try {
            const moderation = await SecurityService.moderateContent(message, user.id);
            if (!moderation.is_approved) {
                sendEvent('error', {
                    chunk: 'Сообщение содержит недопустимый контент',
                    done: true,
                });
                res.end();
                return;
            }

            if (conversation_id) {
                const conversation = await getConversationModel().findOne({id: mongoose.trusted(conversation_id)}).lean();
                if (!conversation || conversation.user_id !== user.id) {
                    sendEvent('error', {chunk: 'Диалог не найден или нет доступа', done: true});
                    res.end();
                    return;
                }
            }

            const userMessageId = randomUUID();
            await getMessageModel().create({
                id: userMessageId,
                conversation_id: conversation_id ?? '',
                user_id: user.id,
                content: message,
                role: 'user',
                message_type: 'text',
                status: 'sent',
                moderation_passed: true,
                moderation_notes: moderation.moderation_notes ?? [],
                created_at: new Date(),
                updated_at: new Date(),
            });

            const prompt = await buildPromptWithHistory(conversation_id ?? '', message);
            const fullResponse = await MCP_Client.chat(prompt);

            const messageId = randomUUID();
            const words = fullResponse.split(/(\s+)/);
            let accumulated = '';

            for (const chunk of words) {
                if (!chunk) {continue;}
                accumulated += chunk;

                sendEvent('chunk', {
                    event: 'chunk',
                    data: {
                        chunk,
                        done: false,
                        message_id: messageId,
                    },
                    conversation_id,
                });

                await new Promise((r) => setTimeout(r, 15));
            }

            const assistantMessage = await getMessageModel().create({
                id: messageId,
                conversation_id: conversation_id ?? '',
                user_id: user.id,
                content: fullResponse,
                role: 'assistant',
                message_type: 'text',
                status: 'sent',
                parent_message_id: userMessageId,
                moderation_passed: true,
                moderation_notes: [],
                usage_data: {
                    prompt_tokens: prompt.split(/\s+/).length,
                    completion_tokens: fullResponse.split(/\s+/).length,
                    total_tokens: prompt.split(/\s+/).length + fullResponse.split(/\s+/).length,
                    model: 'mcp-local',
                },
                created_at: new Date(),
                updated_at: new Date(),
            });

            if (conversation_id) {
                await getConversationModel().updateOne({id: mongoose.trusted(conversation_id)}, {
                    $inc: {message_count: 2},
                    $set: {
                        last_message: fullResponse.slice(0, 100),
                        last_message_at: new Date(),
                        updated_at: new Date(),
                    },
                });
            }

            sendEvent('complete', {
                event: 'complete',
                data: {
                    chunk: fullResponse,
                    done: true,
                    message_id: messageId,
                    full_message: assistantMessage.toObject(),
                },
                conversation_id,
            });

            res.end();
        } catch (error) {
            console.error('send_message_stream error:', error);
            sendEvent('error', {chunk: `Ошибка: ${error instanceof Error ? error.message : String(error)}`, done: true});
            res.end();
        }
    }
);

router.get(
    '/search', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const parsed = SearchQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        const {q, conversation_id} = parsed.data;

        try {
            const userConversations = await getConversationModel().find({user_id: user.id}).select('id').lean();
            const conversationIds = userConversations.map((c) => c.id);
            const safeQ = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const query: Record<string, unknown> = {
                content: mongoose.trusted({$regex: safeQ, $options: 'i'}),
            };
            if (conversation_id) {
                if (!/^[a-zA-Z0-9_-]+$/.test(String(conversation_id))) {
                    return res.status(400).json({success: false, error: 'Invalid conversation ID format'});
                }
                if (!conversationIds.includes(String(conversation_id))) {
                    return res.status(403).json({success: false, error: 'Access denied to this conversation'});
                }
                query.conversation_id = String(conversation_id);
            } else {
                query.conversation_id = mongoose.trusted({$in: conversationIds});
            }

            const messages = await getMessageModel().find(query).sort({created_at: -1}).limit(100).lean();

            return res.json({
                success: true,
                data: {
                    search_results: messages,
                    total: messages.length,
                    query: q,
                },
                message: 'Поиск выполнен успешно',
            });
        } catch (error) {
            console.error('search_messages error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при поиске',
            });
        }
    }
);

router.get(
    '/analytics', 
    authMiddleware, 
    requirePermission(Permission.SYSTEM_CONFIG),
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const days = 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        try {
            const userConversations = await getConversationModel().find({user_id: user.id}).select('id').lean();
            const conversationIds = userConversations.map((c) => c.id);
            const [totalMessages, activeConversationsList, totalConversations] = await Promise.all([
                getMessageModel().countDocuments({
                    conversation_id: mongoose.trusted({$in: conversationIds}),
                    created_at: mongoose.trusted({$gte: since}),
                }),
                getMessageModel().distinct('conversation_id', {
                    conversation_id: mongoose.trusted({$in: conversationIds}),
                    created_at: mongoose.trusted({$gte: since}),
                }),
                userConversations.length,
            ]);
            const activeConversations = activeConversationsList.length;
            const usageAgg = await getMessageModel().aggregate([{$match: {conversation_id: {$in: conversationIds}, created_at: {$gte: since}, 'usage_data.total_tokens': {$exists: true}}}, {$group: { _id: null, total_tokens: {$sum: '$usage_data.total_tokens'}}}]).exec();
            const totalTokens = usageAgg[0]?.total_tokens ?? 0;

            return res.json({
                success: true,
                data: {
                    total_messages: totalMessages,
                    active_conversations: activeConversations,
                    total_conversations: totalConversations,
                    total_tokens: totalTokens,
                    period_days: days,
                    avg_messages_per_day: days > 0 ? Math.round((totalMessages / days) * 100) / 100 : 0,
                    avg_tokens_per_day: days > 0 ? Math.round((totalTokens / days) * 100) / 100 : 0,
                },
                message: 'Аналитика успешно получена',
            });
        } catch (error) {
            console.error('get_chat_analytics error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при получении аналитики',
            });
        }
    }
);