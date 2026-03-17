import OpenAI from 'openai';
import { z } from 'zod';
import type { Category, ParsedExpense } from '../types';

const Categories = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Travel',
  'Other',
] as const satisfies readonly Category[];

const ParsedExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('INR'),
  category: z.enum(Categories).default('Other'),
  description: z.string().min(1),
  merchant: z.string().min(1).nullable(),
});

const ErrorSchema = z.object({
  error: z.string(),
  amount: z.null(),
});

type ParsedOrError = ParsedExpense | { error: string; amount: null };

function getClient() {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('Missing AI_API_KEY');
  return new OpenAI({
    apiKey,
    baseURL: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1',
  });
}

const SYSTEM_PROMPT = `You are an expense parser. Extract expense information from natural language input.

RULES:
1. Extract the amount as a number (no currency symbols)
2. Default currency is INR unless explicitly mentioned (USD, EUR, etc.)
3. Categorize into EXACTLY one of these categories:
   - Food & Dining (restaurants, cafes, food delivery, groceries)
   - Transport (uber, ola, taxi, fuel, parking, metro)
   - Shopping (clothes, electronics, amazon, flipkart)
   - Entertainment (movies, netflix, spotify, games)
   - Bills & Utilities (electricity, water, internet, phone)
   - Health (medicine, doctor, gym, pharmacy)
   - Travel (flights, hotels, trips)
   - Other (anything that doesn't fit above)
4. Description should be a clean summary (not the raw input)
5. Merchant is the company/store name if mentioned, null otherwise

RESPOND ONLY WITH VALID JSON, no other text:
{
  "amount": <number>,
  "currency": "<string>",
  "category": "<string>",
  "description": "<string>",
  "merchant": "<string or null>"
}

If the input is invalid or you cannot extract an amount, respond:
{
  "error": "Could not parse expense. Please include an amount.",
  "amount": null
}`;

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Sometimes models wrap JSON in code fences; attempt a minimal extraction.
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('AI did not return valid JSON');
  }
}

export async function parseExpense(text: string): Promise<ParsedOrError> {
  const input = text.trim();
  if (!input) return { error: 'Input is required', amount: null };

  const model = process.env.AI_MODEL || 'llama-3.1-70b-versatile';
  const client = getClient();

  let content: string | null | undefined;
  try {
    const resp = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    });
    content = resp.choices?.[0]?.message?.content;
  } catch (err) {
    console.error(err);
    return { error: 'AI service error. Please try again.', amount: null };
  }

  if (!content) return { error: 'AI returned empty response', amount: null };

  let json: unknown;
  try {
    json = safeJsonParse(content);
  } catch {
    return { error: 'Could not parse expense. Please include an amount.', amount: null };
  }

  const errParsed = ErrorSchema.safeParse(json);
  if (errParsed.success) return errParsed.data;

  const parsed = ParsedExpenseSchema.safeParse(json);
  if (!parsed.success) {
    return { error: 'Could not parse expense. Please include an amount.', amount: null };
  }

  const normalized: ParsedExpense = {
    amount: parsed.data.amount,
    currency: (parsed.data.currency || 'INR').toUpperCase(),
    category: parsed.data.category || 'Other',
    description: parsed.data.description.trim(),
    merchant: parsed.data.merchant ? parsed.data.merchant.trim() : null,
  };

  if (!normalized.currency || normalized.currency.length !== 3) normalized.currency = 'INR';
  if (!Categories.includes(normalized.category)) normalized.category = 'Other';

  return normalized;
}

