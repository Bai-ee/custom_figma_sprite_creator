export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export const OPENAI_CONFIG = {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    max_tokens: 1000,
}
