import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const apiKey = process.env.OPENAI_API_KEY;
let openai = null;

if (apiKey && apiKey !== 'your-openai-api-key-here') {
  openai = new OpenAI({ apiKey });
  console.log('OpenAI service client successfully initialized.');
} else {
  console.log('OPENAI_API_KEY not configured; chatbot will run in simulation mock mode.');
}

/**
 * Queries OpenAI to obtain a chatbot completion contextualized by a learning passage.
 * @param {string} passageText - The reading text or transcript associated with the activity
 * @param {Array} history - Preceding message list in format [{ role: 'user'|'assistant', message: string }]
 * @param {string} userMessage - The latest message sent by the student
 * @returns {Promise<string>} The assistant's text response
 */
export const getChatbotResponse = async (passageText, history, userMessage) => {
  if (!openai) {
    // Return a rich mockup response to ensure testing works without external API keys
    return `[Mock AI Assistant] I received your message: "${userMessage}". We are reviewing the following material: "${passageText ? passageText.substring(0, 100) + '...' : 'None'}". What specific vocabulary or detail would you like to discuss?`;
  }

  try {
    const systemInstruction = `You are a professional, helpful language learning tutor chatbot. Your goal is to help a student practice their language skills and understand the following content:

--- START OF CONTENT CONTEXT ---
${passageText || 'No background content context was provided for this activity.'}
--- END OF CONTENT CONTEXT ---

Guidelines:
1. Encourage discussion about the theme, structure, or vocabulary of the provided content.
2. Answer student questions about grammar, dictionary terms, or core comprehension.
3. Keep responses clean, concise, and appropriate for intermediate language students.
4. Correct the student's grammar or sentence phrasing politely if they make mistakes.
5. Use standard markdown formatting (such as bullet points, numbered lists, and bold text) and separate items or points with clear newlines to make reading easy.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.message })),
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error invoking OpenAI API:', error);
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
};
