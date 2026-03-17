import { Platform } from 'react-native';
import type { Expense } from '../types/expense';

const CUSTOM_BASE_URL: string | null = null;

function getBaseUrl() {
  if (CUSTOM_BASE_URL) return CUSTOM_BASE_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://127.0.0.1:3000';
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as any;
    if (json?.error && typeof json.error === 'string') return json.error;
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function addExpense(input: string): Promise<Expense> {
  const res = await fetchWithTimeout(`${getBaseUrl()}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as any;
  if (!json?.success || !json?.expense) throw new Error('Unexpected server response');
  return json.expense as Expense;
}

export async function getExpenses(): Promise<Expense[]> {
  const res = await fetchWithTimeout(`${getBaseUrl()}/api/expenses`, { method: 'GET' });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as any;
  if (!json?.success || !Array.isArray(json?.expenses)) throw new Error('Unexpected server response');
  return json.expenses as Expense[];
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetchWithTimeout(`${getBaseUrl()}/api/expenses/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  const json = (await res.json()) as any;
  if (!json?.success) throw new Error('Unexpected server response');
}

