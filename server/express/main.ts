import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { convert, convertTypes } from '../parser/converter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.env.PROJECT_ROOT || __dirname;
const SERVER_PORT = Number(process.env.SERVER_PORT) || 39143;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 100;

const rateLimiter = (req: express.Request, _res: express.Response, next: express.NextFunction): void => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        next();
        return;
    }

    if (record.count >= RATE_LIMIT_MAX) {
        _res.status(429).json({ success: false, error: 'Too many requests' });
        return;
    }

    record.count += 1;
    next();
};

app.use(helmet());
app.use(helmet.hidePoweredBy());
const allowedOrigins = new Set(['http://localhost:39143']);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(rateLimiter);
app.use(express.json({ limit: '256mb' }));
app.use(express.urlencoded({ extended: true, limit: '256mb' }));

const STATIC_ROOT = (() => {
    const distMyApp = path.join(PROJECT_ROOT, 'dist', 'MyApp');
    const srcMyApp = path.join(PROJECT_ROOT, 'MyApp');
    if (process.env.STATIC_ROOT) {return process.env.STATIC_ROOT;}
    if (fs.existsSync(path.join(distMyApp, 'index.html'))) {return distMyApp;}
    if (fs.existsSync(path.join(srcMyApp, 'index.html'))) {return srcMyApp;}
    return distMyApp;
})();

app.use(express.static(STATIC_ROOT));

app.get('/', (req, res) => {
    console.log('Request received from:', req.ip);
    console.log('Project root:', PROJECT_ROOT);
    console.log('Static root:', STATIC_ROOT);
    res.sendFile(path.join(STATIC_ROOT, 'index.html'), (err) => {
        if (err) {
            console.error('Error sending index.html:', err);
            res.status(500).send('Failed to serve index.html');
        }
    });
});

app.get('/api/info', (req, res) => {
    console.log(`[INFO] ${req.method} ${req.path} from ${req.ip}`);
    res.json({
        projectRoot: PROJECT_ROOT,
        environment: NODE_ENV,
        port: SERVER_PORT,
        timestamp: new Date().toISOString()
    });
});

app.post('/convert', async (req, res) => {
    const { type, data } = req.body as { type?: string; data?: string };
    if (typeof type !== 'string' || typeof data !== 'string') {
        return res.status(400).json({ success: false, error: 'type и data обязательны (строки)' });
    }
    try {
        const result = await convert(type, data);
        res.json({ success: true, type, data: result });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, error: message });
    }
});

app.get('/convert/types', (_req, res) => {
    res.json({ types: convertTypes });
});

app.post('/parse/site', async (req, res) => {
    const { url, selector, timeout, headers } = req.body as {
        url?: string;
        selector?: string;
        timeout?: number;
        headers?: Record<string, string>;
    };
    if (typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'url обязателен' });
    }
    try {
        const result = await convert('site2json', JSON.stringify({ url, selector, timeout, headers }));
        res.json({ success: true, data: JSON.parse(result) });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ success: false, error: message });
  }
});

app.get('/files/*splat', (req, res) => {
    const splat = req.params.splat;
    const filePath = Array.isArray(splat) ? splat.join('/') : String(splat ?? '');
    
    if (filePath.includes('..') || path.isAbsolute(filePath)) {
        return res.status(403).send('Access denied');
    }
    
    const base = path.resolve(PROJECT_ROOT);
    const fullPath = path.resolve(base, filePath);
    
    if (fullPath !== base && !fullPath.startsWith(base + path.sep)) {
        return res.status(403).send('Access denied');
    }
    
    res.sendFile(fullPath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send('File not found');
        }
    });
});

app.listen(SERVER_PORT, () => {
    console.log(`Express сервер запущен на порту ${SERVER_PORT}, окружение: ${NODE_ENV}`);
    console.log(`Project root: ${PROJECT_ROOT}`);
});

export default app;