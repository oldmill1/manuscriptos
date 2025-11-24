import { OpenAIService } from '$lib/services/OpenAIService';
import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text } = await request.json();

		if (!text || typeof text !== 'string') {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		if (!text.trim()) {
			return json({ error: 'Text cannot be empty' }, { status: 400 });
		}

		// Get API key from SvelteKit environment
		const apiKey = env.OPENAI_API_KEY;
		console.log('API Key from env.OPENAI_API_KEY:', apiKey ? 'Found' : 'Not found');

		if (!apiKey) {
			console.error('OPENAI_API_KEY not found in environment');
			return json({ error: 'OpenAI API key not configured on server' }, { status: 500 });
		}

		// Initialize OpenAI service server-side (secure)
		const openaiService = new OpenAIService(apiKey);

		// Send to OpenAI with rewrite prompt
		const response = await openaiService.generateText(
			text,
			"Rewrite this text for clarity. Make it easy to understand and globally accessible."
		);

		if (!response || response.trim() === '') {
			return json({ error: 'OpenAI returned empty response' }, { status: 500 });
		}

		return json({ rewrittenText: response });
	} catch (error) {
		console.error('Rewrite API error:', error);
		
		// Check if it's an API key error
		if (error instanceof Error && error.message.includes('API key')) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		return json({ error: 'Failed to rewrite text' }, { status: 500 });
	}
};
