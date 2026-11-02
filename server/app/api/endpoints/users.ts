import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { 
    AuthenticatedRequest,
    Permission,
    requirePermission
} from '../../core/rbac';
import { authMiddleware } from '../../core/security';
import { 
    ListQuerySchema, 
    UserCreateSchema, 
    UserResponseSchema, 
    UserUpdateSchema
} from '../../schemas/auth';
import { UserService } from '../../services/user_service';

export const router = Router();

router.post(
    '/',
    authMiddleware,
    requirePermission(Permission.USER_MANAGE),
    async (req: Request, res: Response) => {
        const parsed = UserCreateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const user = await UserService.create(parsed.data);
            const response = UserResponseSchema.parse(user);
            return res.status(201).json(response);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (message.includes('already exists')) {
                return res.status(400).json({ detail: message });
            }
            console.error('create_user error:', error);
            return res.status(500).json({ detail: 'Internal server error' });
        }
    }
);

router.get(
    '/',
    authMiddleware,
    requirePermission(Permission.USER_READ),
    async (req: Request, res: Response) => {
        const parsed = ListQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Invalid query',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        const { skip, limit, role, is_active, search } = parsed.data;

        try {
            const { users, total } = await UserService.list({
                skip,
                limit,
                filters: {
                    role,
                    is_active,
                    search,
                },
            });

            const response = users.map((u) => UserResponseSchema.parse(u));
            return res.json({
                users: response,
                total,
                page: Math.floor(skip / limit) + 1,
                size: limit,
            });
        } catch (error) {
            console.error('list_users error:', error);
            return res.status(500).json({ detail: 'Internal server error' });
        }
    }
);

router.get(
    '/:id',
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({ detail: 'Authentication required' });
        }

        const { id } = req.params as { id: string };
        if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({ detail: 'Invalid user ID format' });
        }
        const isSelf = currentUser.id === id;
        const canRead = isSelf || currentUser.role === 'admin';

        if (!canRead) {
            return res.status(403).json({ detail: 'Not enough permissions' });
        }

        try {
            const user = await UserService.getById(id);
            if (!user) {
                return res.status(404).json({ detail: 'User not found' });
            }

            const response = UserResponseSchema.parse(user);
            return res.json(response);
        } catch (error) {
            console.error('read_user error:', error);
            return res.status(500).json({ detail: 'Internal server error' });
        }
    }
);

router.put(
    '/:id',
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({ detail: 'Authentication required' });
        }

        const { id } = req.params as { id: string };
        if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({ detail: 'Invalid user ID format' });
        }
        const isSelf = currentUser.id === id;
        const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';

        if (!isSelf && !canManage) {
            return res.status(403).json({ detail: 'Not enough permissions' });
        }

        const parsed = UserUpdateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        if (!canManage) {
            delete (parsed.data as Record<string, unknown>).role;
            delete (parsed.data as Record<string, unknown>).status;
        }

        try {
            const updated = await UserService.update(id, parsed.data);
            if (!updated) {
                return res.status(404).json({ detail: 'User not found' });
            }

            const response = UserResponseSchema.parse(updated);
            return res.json(response);
        } catch (error) {
            console.error('update_user error:', error);
            return res.status(500).json({ detail: 'Internal server error' });
        }
    }
);

router.delete(
    '/:id',
    authMiddleware,
    requirePermission(Permission.USER_DELETE),
    async (req: AuthenticatedRequest, res: Response) => {
        const { id } = req.params as { id: string };
        if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({ detail: 'Invalid user ID format' });
        }

        try {
            const success = await UserService.delete(id);
            if (!success) {
                return res.status(404).json({ detail: 'User not found' });
            }
            return res.status(204).send();
        } catch (error) {
            console.error('delete_user error:', error);
            return res.status(500).json({ detail: 'Internal server error' });
        }
    }
);