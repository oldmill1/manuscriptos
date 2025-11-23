import OpenAI from 'openai';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface CompletionRequest {
	messages: ChatMessage[];
	model?: string;
	temperature?: number;
	maxTokens?: number;
	instructions?: string;
}

export interface CompletionResponse {
	message: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

export class OpenAIService {
	private client: OpenAI;

	constructor(apiKey?: string) {
		const key = apiKey || this.getApiKey();
		if (!key) {
			throw new Error(
				'OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey parameter.'
			);
		}

		this.client = new OpenAI({
			apiKey: key,
			dangerouslyAllowBrowser: false // Note: For production, API calls should go through a backend
		});
	}

	private getApiKey(): string | undefined {
		// Check for environment variable (server-side)
		if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.OPENAI_API_KEY) {
			return (globalThis as any).process.env.OPENAI_API_KEY;
		}

		// For development, you might want to store this differently
		// In production, this should be handled by your backend
		return undefined;
	}

	async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
		try {
			const messages: ChatMessage[] = [];

			// Add system instructions if provided
			if (request.instructions) {
				messages.push({
					role: 'system',
					content: request.instructions
				});
			}

			// Add the user messages
			messages.push(...request.messages);

			const completion = await this.client.chat.completions.create({
				model: request.model || 'gpt-4o-mini',
				messages: messages,
				temperature: request.temperature ?? 0.7,
				max_tokens: request.maxTokens ?? 1000
			});

			const message = completion.choices[0]?.message?.content || '';

			return {
				message: message.trim(),
				usage: completion.usage
					? {
							promptTokens: completion.usage.prompt_tokens,
							completionTokens: completion.usage.completion_tokens,
							totalTokens: completion.usage.total_tokens
						}
					: undefined
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`OpenAI API error: ${error.message}`);
			}
			throw new Error('Unknown error occurred while calling OpenAI API');
		}
	}

	async generateItems(
		prompt: string,
		instructions: string = 'Generate a list of items based on the user prompt.',
		itemCount: number = 5
	): Promise<string[]> {
		try {
			const response = await this.createCompletion({
				messages: [
					{
						role: 'user',
						content: `${prompt}\n\nPlease generate exactly ${itemCount} items, one per line.`
					}
				],
				instructions: instructions,
				temperature: 0.8,
				maxTokens: 500
			});

			// Split by lines and filter out empty lines
			const items = response.message
				.split('\n')
				.map((item) => item.replace(/^[-*•]\s*/, '').trim()) // Remove bullet points
				.filter((item) => item.length > 0)
				.slice(0, itemCount); // Ensure we don't exceed requested count

			return items;
		} catch (error) {
			throw new Error(`Failed to generate items: ${error}`);
		}
	}

	async generateText(
		prompt: string,
		instructions: string = 'Generate text based on the user prompt.',
		maxLength: number = 1000
	): Promise<string> {
		try {
			const response = await this.createCompletion({
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				instructions: instructions,
				temperature: 0.7,
				maxTokens: maxLength
			});

			return response.message;
		} catch (error) {
			throw new Error(`Failed to generate text: ${error}`);
		}
	}

	async generateJson<T>(
		prompt: string,
		instructions: string = 'Generate a JSON response based on the user prompt.',
		schema?: any
	): Promise<T> {
		try {
			let jsonInstructions = `${instructions}\n\nIMPORTANT: Respond with valid JSON only. Do not include any explanations or text outside the JSON structure.`;

			if (schema) {
				jsonInstructions += `\n\nUse this JSON schema:\n${JSON.stringify(schema, null, 2)}`;
			}

			const response = await this.createCompletion({
				messages: [
					{
						role: 'user',
						content: prompt
					}
				],
				instructions: jsonInstructions,
				temperature: 0.3, // Lower temperature for more consistent JSON
				maxTokens: 1000
			});

			try {
				return JSON.parse(response.message) as T;
			} catch (parseError) {
				throw new Error(`Failed to parse JSON response: ${response.message}`);
			}
		} catch (error) {
			throw new Error(`Failed to generate JSON: ${error}`);
		}
	}
}

// Note: For production use, API calls should go through your backend
// rather than calling OpenAI directly from the browser
// Use: const openaiService = new OpenAIService('your-api-key');
