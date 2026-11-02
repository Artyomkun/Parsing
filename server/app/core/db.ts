import 'dotenv/config';
import mongoose from 'mongoose';

mongoose.set('sanitizeFilter', true);

export interface HealthStatus {
	status: 'healthy' | 'unhealthy' | 'degraded';
	database?: string;
	host?: string;
	port?: number;
	latency_ms?: number;
	error?: string;
}

export const Database = (() => {
	let connection: mongoose.Connection;

	const connect = async (): Promise<void> => {
        if (connection) {return;}

        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not set');
        }

        connection = await mongoose.createConnection(uri, {
            maxPoolSize: 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            heartbeatFrequencyMS: 10000,
        }).asPromise();
    };

	const healthCheck = async (): Promise<HealthStatus> => {
        if (!connection) {
            return { status: 'unhealthy', error: 'Not connected' };
        }

        const db = connection.db;
        if (!db) {
            return { status: 'unhealthy', error: 'Database not initialized' };
        }

        try {
            const start = Date.now();
            await db.admin().ping();
            return {
                status: 'healthy',
                database: connection.name,
                host: connection.host,
                port: connection.port,
                latency_ms: Date.now() - start,
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : String(error),
            };
        }
    };

	const getConnection = (): mongoose.Connection => {
		if (!connection) {throw new Error('Database not connected');}
		return connection;
	};

	const close = async (): Promise<void> => {
        if (!connection) {return;}
        await connection.close();
    };

	return {
		connect,
		healthCheck,
		getConnection,
		close,
	};
})();