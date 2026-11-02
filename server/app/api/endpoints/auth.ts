import {type Request, type Response, type NextFunction, Router} from 'express';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';

import {AuthenticatedRequest, Permission, requirePermission} from '../../core/rbac';
import {RedisManager} from '../../core/redis';
import {authMiddleware, SecurityService} from '../../core/security';

const csrfTokens = new Map<string, string>();

const generateCsrfToken = (): string => randomUUID();

const setCsrfToken = (_req: Request, res: Response, next: NextFunction): void => {
    const token = generateCsrfToken();
    csrfTokens.set(token, token);
    res.setHeader('X-CSRF-Token', token);
    res.setHeader('Access-Control-Expose-Headers', 'X-CSRF-Token');
    next();
};

const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers['x-csrf-token'] as string | undefined;
    if (!token || !csrfTokens.has(token)) {
        res.status(403).json({success: false, error: 'CSRF token validation failed'});
        return;
    }
    csrfTokens.delete(token);
    next();
};
import {ChangePasswordSchema, ForgotPasswordSchema, LoginSchema, RefreshSchema, RegisterSchema, ResetPasswordSchema, UpdateProfileSchema} from '../../schemas/auth';
import {emailService} from '../../services/email_service';
import {UserService} from '../../services/user_service';

export const router = Router();

// CSRF protection for state-changing methods
router.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        setCsrfToken(req, res, next);
    } else {
        csrfMiddleware(req, res, next);
    }
});

const getBaseUrl = (req: Request): string => {
    const protocol = req.protocol;
    const host = req.get('host') ?? 'localhost';
    return `${protocol}://${host}/`;
};

router.post(
    '/register', 
    async (req: Request, res: Response) => {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const {email, username} = parsed.data;
            const existingByEmail = await UserService.getByEmail(email);

            if (existingByEmail) {
                return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким email уже существует',
                });
            }

            const existingByUsername = await UserService.getByUsername(username);
            if (existingByUsername) {
                return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким username уже существует',
                });
            }

            const user = await UserService.create(parsed.data);
            const verificationToken = randomUUID();
            await UserService.createEmailVerificationToken(String(user.id), verificationToken);
            const verificationUrl = `${getBaseUrl(req)}api/auth/verify-email?token=${verificationToken}`;
            await emailService.sendVerificationEmail(user.email, user.username, verificationUrl);

            return res.status(201).json({
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active,
                },
                message: 'Пользователь успешно зарегистрирован. Проверьте email для подтверждения.',
            });
        } catch (error) {
            console.error('register error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при регистрации',
            });
        }
    }
);

router.post(
    '/login', 
    async (req: Request, res: Response) => {
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const user = await UserService.authenticate(
                parsed.data.username, parsed.data.password);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверные учетные данные',
                });
            }

            if (!user.is_active) {
                return res.status(400).json({
                    success: false,
                    error: 'Аккаунт деактивирован',
                });
            }

            if (!user.email_verified) {
                return res.status(400).json({
                    success: false,
                    error: 'Email не подтвержден. Проверьте вашу почту.',
                });
            }

            const accessToken = await SecurityService.createAccessToken({
                sub: String(user.id),
                role: user.role,
            });
            const refreshToken = await SecurityService.createRefreshToken({
                sub: String(user.id),
            });

            return res.json({
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'bearer',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active,
                    first_name: user.first_name,
                    last_name: user.last_name,
                },
            });
        } catch (error) {
            console.error('login error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при входе',
            });
        }
    }
);

router.post(
    '/refresh', 
    async (req: Request, res: Response) => {
        const parsed = RefreshSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const payload = await SecurityService.verifyToken(parsed.data.refresh_token, true);
            if (!payload) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный refresh token',
                });
            }

            const userId = payload.sub;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверный токен',
                });
            }

            const user = await UserService.getById(userId);
            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не найден или неактивен',
                });
            }

            const accessToken = await SecurityService.createAccessToken({
                sub: String(user.id),
                role: user.role,
            });
            const newRefreshToken = await SecurityService.createRefreshToken({
                sub: String(user.id),
            });

            return res.json({
                access_token: accessToken,
                refresh_token: newRefreshToken,
                token_type: 'bearer',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active,
                },
            });
        } catch (error) {
            console.error('refresh_token error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при обновлении токена',
            });
        }
    }
);

router.post(
    '/logout', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user)
            {return res.status(401).json(
                {success: false, error: 'Authentication required'});}

        try {
            const logoutTime = Math.floor(Date.now() / 1000);

            await RedisManager.setex(`user:${user.id}:logout_time`, 3600, String(logoutTime));

            res.clearCookie('access_token');
            res.clearCookie('refresh_token');

            return res.json({
                success: true,
                data: {user_id: user.id, logout_time: logoutTime},
                message: 'Успешный выход из системы',
            });
        } catch (error) {
            console.error('logout error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при выходе',
            });
        }
    }
);

router.get(
    '/verify-email', 
    async (req: Request, res: Response) => {
        const token = req.query.token;

        if (typeof token !== 'string' || !token) {
            return res.status(400).json({
                success: false,
                error: 'Токен обязателен',
            });
        }

        try {
            const success = await UserService.verifyEmailToken(token);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный или просроченный токен подтверждения',
                });
            }

            return res.json({
                success: true,
                message: 'Email успешно подтвержден',
            });
        } catch (error) {
            console.error('verify_email error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при подтверждении email',
            });
        }
    }
);

router.post(
    '/resend-verification', 
    async (req: Request, res: Response) => {
        const email = req.body?.email;

        if (typeof email !== 'string') {
            return res.status(400).json({
            success: false,
            error: 'email обязателен',
            });
        }

        try {
            const user = await UserService.getByEmail(email);

            if (!user) {
                return res.json({
                    success: true,
                    message:
                        'Если email зарегистрирован, письмо для подтверждения отправлено',
                });
            }

            if (user.email_verified) {
                return res.status(400).json({
                    success: false,
                    error: 'Email уже подтвержден',
                });
            }

            const verificationToken = randomUUID();
            await UserService.createEmailVerificationToken(String(user.id), verificationToken);

            const verificationUrl = `${getBaseUrl(req)}api/auth/verify-email?token=${verificationToken}`;
            await emailService.sendVerificationEmail(user.email, user.username, verificationUrl);

            return res.json({
                success: true,
                message: 'Письмо для подтверждения отправлено',
            });
        } catch (error) {
            console.error('resend_verification error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при отправке письма',
            });
        }
    }
);

router.post(
    '/forgot-password', 
    async (req: Request, res: Response) => {
        const parsed = ForgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const user = await UserService.getByEmail(parsed.data.email);

            if (!user) {
                return res.json({
                    success: true,
                    message: 'Если email зарегистрирован, инструкции по сбросу пароля отправлены',
                });
            }

            if (!user.is_active) {
                return res.status(400).json({
                    success: false,
                    error: 'Аккаунт деактивирован',
                });
            }

            const resetToken = randomUUID();
            await UserService.createPasswordResetToken(String(user.id), resetToken);

            const resetUrl = `${getBaseUrl(req)}reset-password?token=${resetToken}`;
            await emailService.sendPasswordResetEmail(user.email, user.username, resetUrl);

            return res.json({
                success: true,
                message: 'Инструкции по сбросу пароля отправлены на email',
            });
        } catch (error) {
            console.error('forgot_password error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при запросе сброса пароля',
            });
        }
    }
);

router.post(
    '/reset-password', 
    async (req: Request, res: Response) => {
        const parsed = ResetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const success = await UserService.resetPasswordWithToken(parsed.data.token, parsed.data.new_password);

            if (!success) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный или просроченный токен сброса пароля',
                });
            }

            return res.json({
                success: true,
                message: 'Пароль успешно изменен',
            });
        } catch (error) {
            console.error('reset_password error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при сбросе пароля',
            });
        }
    }
);

router.post(
    '/change-password', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const parsed = ChangePasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const changed = await UserService.changePassword(
                user.id, parsed.data.current_password, parsed.data.new_password);

            if (!changed) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный текущий пароль',
                });
            }

            return res.json({
                success: true,
                message: 'Пароль успешно изменен',
            });
        } catch (error) {
            console.error('change_password error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при изменении пароля',
            });
        }
    }
);

router.get(
    '/me', 
    authMiddleware, 
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        return res.json({
            success: true,
            data: user,
            message: 'Данные пользователя получены',
        });
    }
);

router.put(
    '/me', 
    authMiddleware, 
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        const parsed = UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: z.flattenError(parsed.error).fieldErrors,
            });
        }

        try {
            const data = parsed.data;
            if (data.email && data.email !== user.email) {
                const existing = await UserService.getByEmail(data.email);
                if (existing && String(existing.id) !== user.id) {
                    return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким email уже существует',
                    });
                }
            }

            if (data.username && data.username !== user.username) {
                const existing = await UserService.getByUsername(data.username);
                if (existing && String(existing.id) !== user.id) {
                    return res.status(400).json({
                    success: false,
                    error: 'Пользователь с таким username уже существует',
                    });
                }
            }

            const updated = await UserService.update(user.id, data);
            if (!updated) {
            return res.status(404).json(
                {success: false, error: 'Пользователь не найден'});
            }

            return res.json({
                success: true,
                data: updated,
                message: 'Профиль успешно обновлен',
            });
        } catch (error) {
            console.error('update_profile error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при обновлении профиля',
            });
        }
    }
);

router.post(
    '/me/deactivate', 
    authMiddleware,
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {return res.status(401).json({success: false, error: 'Authentication required'});}

        try {
            await UserService.deactivate(user.id);
            return res.json({
                success: true,
                message: 'Аккаунт успешно деактивирован',
            });
        } catch (error) {
            console.error('deactivate_account error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при деактивации аккаунта',
            });
        }
    }
);

router.post(
    '/admin/users/:id/activate',
    authMiddleware,
    requirePermission(Permission.ADMIN),
    async (req: AuthenticatedRequest, res: Response) => {
        const {id} = req.params as {id: string};
        if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({success: false, error: 'Invalid user ID format'});
        }
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({detail: 'Authentication required'});
        }
        if (currentUser.id === id) {
            return res.status(400).json({success: false, error: 'Нельзя активировать собственную учетную запись через этот endpoint'});
        }

        try {
            const success = await UserService.activate(id);
            if (!success) {
            return res.status(404).json(
                {success: false, error: 'Пользователь не найден'});
            }

            const activated = await UserService.getById(id);

            return res.json({
                success: true,
                data: activated,
                message: 'Пользователь успешно активирован',
            });
        } catch (error) {
            console.error('activate_user error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при активации пользователя',
            });
        }
    }
);

router.post(
    '/admin/users/:id/deactivate',
    authMiddleware,
    requirePermission(Permission.USER_DELETE),
    async (req: AuthenticatedRequest, res: Response) => {
        const {id} = req.params as {id: string};
        if (!id || typeof id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({success: false, error: 'Invalid user ID format'});
        }
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({detail: 'Authentication required'});
        }
        if (currentUser.id === id) {
            return res.status(400).json({success: false, error: 'Нельзя деактивировать собственную учетную запись через этот endpoint'});
        }

        try {
            const success = await UserService.deactivate(id);
            if (!success) {
            return res.status(404).json(
                {success: false, error: 'Пользователь не найден'});
            }

            const deactivated = await UserService.getById(id);

            return res.json({
                success: true,
                data: deactivated,
                message: 'Пользователь успешно деактивирован',
            });
        } catch (error) {
            console.error('deactivate_user error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при деактивации пользователя',
            });
        }
    }
);

router.post(
    '/admin/users/:id/reset-password',
    authMiddleware,
    requirePermission(Permission.USER_RESET_PASSWORD),
    async (req: AuthenticatedRequest, res: Response) => {
        const {id} = req.params as {id: string};
        const currentUser = req.user;
        if (!currentUser) {
            return res.status(401).json({detail: 'Authentication required'});
        }
        if (currentUser.id === id) {
            return res.status(400).json({success: false, error: 'Нельзя сбросить пароль собственной учетной записи через этот endpoint'});
        }

        try {
            const newPassword = await UserService.adminResetPassword(id);
            if (!newPassword) {
            return res.status(404).json(
                {success: false, error: 'Пользователь не найден'});
            }

            const user = await UserService.getById(id);
            if (user) {
            await emailService.sendNewPasswordEmail(
                user.email, user.username, newPassword);
            }

            return res.json({
                success: true,
                message: 'Пароль успешно сброшен и отправлен пользователю',
            });
        } catch (error) {
            console.error('admin_reset_password error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при сбросе пароля',
            });
        }
    }
);

router.get(
    '/admin/users', 
    authMiddleware, 
    requirePermission(Permission.USER_MANAGE),
    async (req: AuthenticatedRequest, res: Response) => {
        const skip = Number(req.query.skip) || 0;
        const limit = Math.min(Number(req.query.limit) || 100, 100);
        const activeOnly = req.query.active_only === 'true';

        try {
            const {users, total} = await UserService.list({
                skip,
                limit,
                activeOnly,
            });

            return res.json({
                success: true,
                data: {
                    users,
                    total,
                    page: Math.floor(skip / limit) + 1,
                    page_size: limit,
                    has_more: skip + limit < total,
                },
                message: 'Пользователи успешно получены',
            });
        } catch (error) {
            console.error('get_all_users error:', error);
            return res.status(500).json({
                success: false,
                error: 'Ошибка при получении пользователей',
            });
        }
    }
);

router.get(
    '/health', 
    async (res: Response) => {
        try {
            const count = await UserService.getActiveCount();

            return res.json({
                status: 'healthy',
                database: 'connected',
                users_count: count,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error('auth_health error:', error);
            return res.status(503).json({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
);