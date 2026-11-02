import https from 'node:https';
import fs from 'node:fs';
import { setupWebSocket } from './app/api/ws';
import { settings } from './app/core/config';
import { Database } from './app/core/db';
import { RedisManager, initializeRedis } from './app/core/redis';
import app from './express/main';

let beckend_server: https.Server;

const sslCert = process.env.SSL_CERT_PATH;
const sslKey = process.env.SSL_KEY_PATH;
if (!sslCert || !sslKey || !fs.existsSync(sslCert) || !fs.existsSync(sslKey)) {
    throw new Error('SSL_CERT_PATH and SSL_KEY_PATH are required');
}
const httpsOptions = {
    cert: fs.readFileSync(sslCert),
    key: fs.readFileSync(sslKey),
};
beckend_server = https.createServer(httpsOptions, app);

app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
        return res.status(403).json({ error: 'HTTPS required' });
    }
    next();
});

const start = async (): Promise<void> => {
    try {
        setupWebSocket(beckend_server);
        await Database.connect();
        await initializeRedis();

        await new Promise<void>((resolve) => {
            beckend_server.listen(settings.PORT, () => {
                console.log(`Server listening on https://localhost:${settings.PORT}`);
                resolve();
            });
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

void start();

const shutdown = async (signal: string): Promise<void> => {
    console.log(`${signal} received, shutting down...`);

    const timeout = setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10_000);

    try {
        if (beckend_server) {
            await new Promise<void>((resolve, reject) => {
                beckend_server.close((err) => (err ? reject(err) : resolve()));
            });
            console.log('HTTPS beckend server closed');
        }

        await RedisManager.close();
        console.log('Redis connection closed');

        clearTimeout(timeout);
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));