import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface MCPClient {
	connect(): Promise<void>;
	chat(message: string): Promise<string>;
	learn(topic: string, information: string): Promise<void>;
	disconnect(): Promise<void>;
}

export const MCP_Client: MCPClient = (() => {
	const client = new Client(
		{ name: 'ts-app', version: '1.0.0' },
		{ capabilities: {} }
	);

	let connected = false;

	return {
		async connect(): Promise<void> {
			const transport = new StdioClientTransport({
				command: 'java',
				args: ['-jar', './path/to/ai-server.jar'],
			});

			await client.connect(transport);
			connected = true;
		},

		async chat(message: string): Promise<string> {
			if (!connected) {throw new Error('MCP client not connected');}

			const result = await client.callTool({
				name: 'chat',
				arguments: { message },
			});

			if (!Array.isArray(result.content)) {
				return JSON.stringify(result.content);
			}

			const first = result.content[0];
			if (
				first &&
				typeof first === 'object' &&
				'type' in first &&
				first.type === 'text' &&
				'text' in first &&
				typeof first.text === 'string'
			) {
				return first.text;
			}

			return JSON.stringify(result.content);
		},

		async learn(topic: string, information: string): Promise<void> {
			if (!connected) {throw new Error('MCP client not connected');}

			await client.callTool({
				name: 'learn',
				arguments: { topic, information },
			});
		},

		async disconnect(): Promise<void> {
			if (!connected) {return;}

			await client.close();
			connected = false;
		},
	};
})();