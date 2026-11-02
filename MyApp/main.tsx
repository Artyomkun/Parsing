import express, { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { parseDynamicContent } from '@server/parser/dynamicParser';
import { Parsing } from '@server/types/types';
import { load } from 'cheerio';

const router = express.Router();

const ALLOWED_DIRS = [
	path.join(os.homedir(), 'Documents'),
	path.join(os.homedir(), 'Downloads'),
];

async function isPathAllowed(filePath: string): Promise<boolean> {
	if (filePath.includes('..') || path.isAbsolute(filePath)) {
		throw new Error('Access denied: invalid path');
	}
	
	const resolved = path.resolve(filePath);
	
	return ALLOWED_DIRS.some(dir => {
		const resolvedDir = path.resolve(dir);
		const rel = path.relative(resolvedDir, resolved);
		return !rel.startsWith('..') && !path.isAbsolute(rel);
	});
}

async function validateWebUrl(rawUrl: string): Promise<URL | null> {
	let parsed: URL;
	try {
		parsed = new URL(rawUrl);
	} catch {
		return null;
	}

	if (parsed.protocol !== 'https:') {
		return null;
	}

	const hostname = parsed.hostname;

	// Отбиваем прямые IP (включая 0.0.0.0 и IPv6)
	if (net.isIPv4(hostname) || net.isIPv6(hostname)) {
		return null;
	}

	// Блокируем localhost и внутренние имена
	const localHostPatterns = [
		/^localhost$/i,
		/^127\./,
		/^::1$/,
		/^fe80::/,
		/^0\.0\.0\.0$/,
	];
	if (localHostPatterns.some(p => p.test(hostname))) {
		return null;
	}

	// Разрешаем только стандартные порты (443 для https)
	const port = parsed.port;
	if (port && !['443'].includes(port)) {
		return null;
	}

	// Защита от DNS Rebinding: проверяем, куда реально резолвится домен
	try {
		const addresses = await lookup(hostname, { all: true });
		for (const addr of addresses) {
			if (net.isIPv4(addr.address) || net.isIPv6(addr.address)) {
				const ip = addr.address;
				// Блокируем внутренние и зарезервированные IP
				if (
					ip.startsWith('127.') ||
					ip.startsWith('10.') ||
					ip.startsWith('192.168.') ||
					ip.startsWith('169.254.') ||
					ip === '0.0.0.0' ||
					ip === '::1' ||
					ip.startsWith('fe80::')
				) {
					return null;
				}
			}
		}
	} catch {
		return null; // Если DNS упал, не рискуем
	}

	return parsed;
}

router.post('/parse/dynamic', async (req: Request, res: Response): Promise<void> => {
	const { url, selector, options } = req.body as {
		url?: string;
		selector?: string;
		options?: Parsing.ParseOptions;
	};

	if (typeof url !== 'string' || !url) {
		res.status(400).json({ success: false, error: 'url обязателен' });
		return;
	}
	if (typeof selector !== 'string' || !selector) {
		res.status(400).json({ success: false, error: 'selector обязателен' });
		return;
	}
	if (!options) {
		res.status(400).json({ success: false, error: 'options обязателен' });
		return;
	}

	try {
		const data = await parseDynamicContent(url, selector, options);
		res.json({ success: true, data });
	} catch (error) {
		res.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to parse dynamic content',
		});
	}
});

router.post('/parse/data', async (req: Request, res: Response): Promise<void> => {
	const config = req.body as Parsing.ParseConfig;

	try {
		let result: unknown;

		switch (config.type) {
			case 'dynamic':
				if (!config.options) {
					throw new Error('ParseOptions is required');
				}
				result = await parseDynamicContent(config.url, config.selector, config.options);
				break;
			default:
				throw new Error(`Unsupported parse type: ${config.type}`);
		}

		res.json({ success: true, data: result });
	} catch (error) {
		res.json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to parse data',
		});
	}
});

router.post('/file/info', async (req: Request, res: Response): Promise<void> => {
	const { filePath } = req.body as { filePath?: string };

	if (typeof filePath !== 'string' || !filePath) {
		res.status(400).json({ error: 'Invalid file path' });
		return;
	}

	// Используем ту же проверку, что и в /file/read
	try {
		if (!(await isPathAllowed(filePath))) {
			res.status(403).json({ error: 'Access denied: path outside allowed directories' });
			return;
		}
	} catch {
		res.status(400).json({ error: 'Invalid file path' });
		return;
	}

	try {
		const stats = await fs.stat(filePath);
		res.json({
			path: filePath,
			name: path.basename(filePath),
			size: stats.size,
			createdAt: stats.birthtime,
			modifiedAt: stats.mtime,
			isDirectory: stats.isDirectory(),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: `Failed to get file info: ${message}` });
	}
});

router.post('/parse/csv', (req: Request, res: Response) => {
	try {
		const data = req.body?.data;
		if (typeof data !== 'string') {
			return res.status(400).json({ error: 'data обязателен и должен быть строкой' });
		}
		const parsed = data.split('\n').map(line => line.split(','));
		res.json(parsed);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});

router.post('/parse/web', async (req: Request, res: Response) => {
	const { url } = req.body as { url?: string };
	if (typeof url !== 'string') {
		return res.status(400).json({ error: 'url обязателен' });
	}

	const parsed = await validateWebUrl(url);
	if (!parsed) {
		return res.status(400).json({ error: 'URL не прошёл проверку безопасности' });
	}

	try {
		const response = await fetch(parsed.toString(), {
			signal: AbortSignal.timeout(10_000),
			redirect: 'manual',
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
				Accept: 'text/html,application/xhtml+xml',
			},
		});

		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get('location');
			if (location) {
				try {
					const redirectUrl = new URL(location, parsed);
					if (!(await validateWebUrl(redirectUrl.toString()))) {
						return res.status(400).json({ error: 'Редирект на запрещенные адреса' });
					}
				} catch {
					return res.status(400).json({ error: 'Некорректный URL редиректа' });
				}
			}
		}

		if (!response.ok) {
			return res.status(response.status).json({ error: `HTTP ${response.status}` });
		}

		const html = await response.text();
		const $ = load(html);

		res.json({
			title: $('title').text().trim(),
			headers: $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ error: message });
	}
});

router.post('/file/read', async (req: Request, res: Response) => {
	const { filePath } = req.body as { filePath?: string };
	if (typeof filePath !== 'string' || !filePath) {
		return res.status(400).json({ error: 'filePath обязателен' });
	}

	try {
		if (!(await isPathAllowed(filePath))) {
			return res.status(403).json({ error: 'Access denied: path outside allowed directories' });
		}
	} catch {
		return res.status(400).json({ error: 'Invalid file path' });
	}

	try {
		const content = await fs.readFile(filePath, 'utf-8');
		res.json({ content, filePath });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});

router.post('/file/save', async (req: Request, res: Response) => {
	const { data, format = 'json' } = req.body as {
		data?: unknown;
		format?: 'json' | 'csv';
	};

	const safeFormat = format === 'csv' ? 'csv' : 'json';
	const uniqueId = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
	const outputPath = path.join(ALLOWED_DIRS[0], `parsed_${uniqueId}.${safeFormat}`);

	try {
		let content: string;
		if (safeFormat === 'json') {
			content = JSON.stringify(data, null, 2);
		} else {
			if (!Array.isArray(data) || !data.every((row: unknown) => Array.isArray(row) && row.every((cell: unknown) => typeof cell === 'string'))) {
				return res.status(400).json({ error: 'data должен быть массивом массивов строк для CSV' });
			}
			content = (data as string[][]).map(row => row.join(',')).join('\n');
		}
		await fs.writeFile(outputPath, content, 'utf-8');
		res.json({ outputPath });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		res.status(500).json({ error: message });
	}
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default router;