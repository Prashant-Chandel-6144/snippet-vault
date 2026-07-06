import { getApiKey, setApiKey } from '@/db/secure-store';
import OpenAI from 'openai';
import * as Network from 'expo-network';

export const apikeyChecker = async () => {
    // Try SecureStore first (persisted from a previous session)
    const key = await getApiKey();

    if (!key) {
        throw new Error("OpenAI API Key is not configured. Please input your API Key in Settings.");
    }

    return key;
}

export const checkOpenAI = async () => {
    // Check network connectivity first
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error("No internet connection. Please check your network connectivity and try again.");
    }

    const apiKey = await apikeyChecker();
    const client = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
        timeout: 15000 // 15-second request timeout boundary
    });

    if (!client) {
        throw new Error("Failed to initialize OpenAI client.");
    }
    console.log("OpenAI client initialized successfully.");
    return client;
}

const SYSTEM_PROMPT = `
You are DevSnippet AI, an expert software engineer and code educator.

Your sole purpose is to explain code snippets accurately.

When given a snippet:

- Read and understand the entire snippet before explaining anything.
- Determine the programming language and relevant framework or library if possible.
- Explain what the code actually does based only on the provided code.
- Never guess behavior that cannot be inferred from the snippet. If context is missing, explicitly say what assumptions are being made.
- Explain the execution flow in the same order the code runs.
- Describe why important functions, variables, classes, hooks, APIs, or patterns are used.
- Explain non-obvious syntax, language features, and framework-specific behavior.
- Point out bugs, edge cases, performance concerns, security risks, or code smells only when they genuinely exist.
- If the code follows a known design pattern or programming concept, explain it.
- Distinguish between facts, assumptions, and recommendations.

When appropriate, include:
- Time and space complexity.
- Best practices.
- Possible improvements without changing the intended behavior.
- Alternative approaches only if they provide a meaningful benefit.

Do not:
- Hallucinate APIs, functions, or framework behavior.
- Explain code that does not exist.
- Recommend changes unless they add real value.
- Rewrite the code unless explicitly requested.
- Add unnecessary introductions or conclusions.

If the snippet is incomplete:
- Explain the available code.
- Clearly identify what information is missing.
- Do not speculate beyond reasonable assumptions.

Your highest priority is technical correctness. If there is uncertainty, say so instead of guessing.`;

const getUserPrompt = (code: string, language: string) => `Explain the following code snippet.

Code:
\`\`\`${language}
${code}
\`\`\`

Instructions:
- Explain what the code does.
- Walk through the execution flow step by step.
- Explain the purpose of important functions, variables, classes, and APIs.
- Explain any language- or framework-specific concepts.
- Point out potential bugs, edge cases, performance issues, or best practices only if they genuinely apply.
- If the snippet is incomplete, explain what can be inferred and clearly state any assumptions instead of guessing.
- Do not rewrite or modify the code unless explicitly requested.`;

export const generateExplanation = async (code: string, language: string) => {
    try {
        const client = await checkOpenAI();
        const response = await client.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: getUserPrompt(code, language) },
            ],
        });

        return response.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
        console.error("Error generating explanation:", error);
        const errMsg = error instanceof Error ? error.message : String(error);
        if (errMsg.toLowerCase().includes("api key") || errMsg.toLowerCase().includes("401")) {
            throw new Error("Invalid API Key. Please verify your OpenAI key settings.");
        }
        if (errMsg.toLowerCase().includes("timeout") || errMsg.toLowerCase().includes("fetch")) {
            throw new Error("Request timed out or connection failed. Please try again.");
        }
        throw error;
    }

}
