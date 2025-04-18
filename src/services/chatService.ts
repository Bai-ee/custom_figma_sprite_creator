import { OPENAI_CONFIG } from '../config';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export async function sendMessage(messages: Message[], apiKey: string): Promise<ChatResponse> {
    try {
        const response = await fetch(OPENAI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: OPENAI_CONFIG.model,
                messages: messages,
                temperature: OPENAI_CONFIG.temperature,
                max_tokens: OPENAI_CONFIG.max_tokens,
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get response from ChatGPT');
        }

        const data = await response.json();
        return {
            success: true,
            message: data.choices[0].message.content
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}
