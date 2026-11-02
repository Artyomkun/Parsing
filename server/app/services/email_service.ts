import escapeHtml from 'escape-html';

interface EmailConfig {
    apiKey: string;
    apiUrl: string;
    fromEmail: string;
    frontendUrl: string;
}

const readConfig = (): EmailConfig | null => {
    const apiKey = process.env.EMAIL_API_KEY;
    const apiUrl = process.env.EMAIL_API_URL;
    const fromEmail = process.env.FROM_EMAIL;
    const frontendUrl = process.env.FRONTEND_URL ?? '';

    if (!apiKey || !apiUrl || !fromEmail) {
        console.warn('Email service: missing EMAIL_API_KEY, EMAIL_API_URL or FROM_EMAIL');
        return null;
    }

    return { apiKey, apiUrl, fromEmail, frontendUrl };
};

export class EmailService {
    private config: EmailConfig | null;

    constructor() {
        this.config = readConfig();
    }

    private async sendEmail(
        to: string,
        subject: string,
        html: string,
        text: string
    ): Promise<boolean> {
        if (!this.config) {return false;}

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30_000);

            const res = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    from: this.config.fromEmail,
                    subject,
                    html,
                    text,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeout);
            return res.ok;
        } catch (error) {
            console.error('Email send error:', error);
            return false;
        }
    }

    async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
        const subject = 'Добро пожаловать в ChatBot!';

        const html = `
        <html><body>
            <h1>Добро пожаловать, ${escapeHtml(username)}!</h1>
            <p>Спасибо за регистрацию в нашем сервисе ChatBot.</p>
            <p>Теперь вы можете начать общаться с нашим AI-ассистентом.</p>
            <br><p>С уважением,<br>Команда ChatBot</p>
        </body></html>
        `;

        const text = `Добро пожаловать, ${username}!\n\nСпасибо за регистрацию в нашем сервисе ChatBot.\nТеперь вы можете начать общаться с нашим AI-ассистентом.\n\nС уважением,\nКоманда ChatBot`;

        return this.sendEmail(to, subject, html, text);
    }

    async sendPasswordResetEmail(
        to: string,
        username: string,
        resetToken: string
    ): Promise<boolean> {
        const subject = 'Сброс пароля ChatBot';
        const base = this.config?.frontendUrl ?? '';
        const resetUrl = `${base}/reset-password?token=${encodeURIComponent(resetToken)}`;

        const html = `
        <html><body>
            <h1>Сброс пароля</h1>
            <p>Здравствуйте, ${escapeHtml(username)}!</p>
            <p>Вы запросили сброс пароля для вашего аккаунта.</p>
            <p>Для установки нового пароля перейдите по ссылке:</p>
            <p><a href="${resetUrl}">Сбросить пароль</a></p>
            <p>Ссылка действительна в течение 1 часа.</p>
            <br><p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
            <p>С уважением,<br>Команда ChatBot</p>
        </body></html>
        `;

        const text = `Сброс пароля\n\nЗдравствуйте, ${username}!\n\nВы запросили сброс пароля.\nПерейдите по ссылке:\n${resetUrl}\n\nСсылка действительна 1 час.\n\nС уважением,\nКоманда ChatBot`;

        return this.sendEmail(to, subject, html, text);
    }

    async sendEmailVerification(to: string, verificationToken: string): Promise<boolean> {
        const subject = 'Подтверждение email адреса';
        const base = this.config?.frontendUrl ?? '';
        const url = `${base}/verify-email?token=${encodeURIComponent(verificationToken)}`;

        const html = `
        <html><body>
            <h1>Подтверждение email адреса</h1>
            <p>Пожалуйста, подтвердите ваш email адрес для активации аккаунта.</p>
            <p><a href="${url}">Подтвердить email</a></p>
            <br><p>С уважением,<br>Команда ChatBot</p>
        </body></html>
        `;

        const text = `Подтверждение email адреса\n\nПерейдите по ссылке:\n${url}\n\nС уважением,\nКоманда ChatBot`;

        return this.sendEmail(to, subject, html, text);
    }

    async sendVerificationEmail(
        email: string,
        username: string,
        verificationUrl: string
    ): Promise<void> {
        const subject = 'Подтверждение email адреса';

        const html = `
        <html><body>
            <h2>Здравствуйте, ${escapeHtml(username)}!</h2>
            <p>Для завершения регистрации подтвердите ваш email адрес:</p>
            <p><a href="${verificationUrl}">Подтвердить email</a></p>
            <p>Ссылка действительна в течение 24 часов.</p>
            <br><p>С уважением,<br>Команда поддержки</p>
        </body></html>
        `;

        const text = `Здравствуйте, ${username}!\n\nПодтвердите email по ссылке:\n${verificationUrl}\n\nСсылка действительна 24 часа.`;

        const ok = await this.sendEmail(email, subject, html, text);
        if (ok) {console.log(`Verification email sent to ${email}`);}
        else {console.warn(`Failed to send verification email to ${email}`);}
    }

    async sendNewPasswordEmail(
        to: string,
        username: string,
        newPassword: string
    ): Promise<boolean> {
        const subject = 'Новый пароль для ChatBot';

        const html = `
        <html><body>
            <h1>Новый пароль</h1>
            <p>Здравствуйте, ${escapeHtml(username)}!</p>
            <p>Администратор сбросил ваш пароль.</p>
            <p>Ваш новый пароль: <strong>${escapeHtml(newPassword)}</strong></p>
            <p>Рекомендуем изменить пароль после входа.</p>
            <br><p>С уважением,<br>Команда ChatBot</p>
        </body></html>
        `;

        const text = `Новый пароль\n\nЗдравствуйте, ${username}!\n\nВаш новый пароль: ${newPassword}\n\nС уважением,\nКоманда ChatBot`;

        return this.sendEmail(to, subject, html, text);
    }
}

export const emailService = new EmailService();