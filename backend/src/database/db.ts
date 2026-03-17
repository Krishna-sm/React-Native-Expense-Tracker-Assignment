import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { Expense, ExpenseInput } from '../types';

const dbPath = process.env.DATABASE_PATH || './data/expenses.sqlite';
const resolvedDbPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dir = path.dirname(resolvedDbPath);
    fs.mkdirSync(dir, { recursive: true });
    db = new Database(resolvedDbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      merchant TEXT NULL,
      original_input TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
}

export function createExpense(input: ExpenseInput): Expense {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO expenses (amount, currency, category, description, merchant, original_input)
    VALUES (@amount, @currency, @category, @description, @merchant, @original_input)
  `);

  const info = stmt.run({
    amount: input.amount,
    currency: input.currency,
    category: input.category,
    description: input.description,
    merchant: input.merchant,
    original_input: input.original_input,
  });

  const row = database
    .prepare(`SELECT * FROM expenses WHERE id = ?`)
    .get(info.lastInsertRowid as number) as Expense | undefined;

  if (!row) throw new Error('Failed to create expense');
  return row;
}

export function getAllExpenses(): Expense[] {
  const database = getDb();
  return database.prepare(`SELECT * FROM expenses ORDER BY datetime(created_at) DESC, id DESC`).all() as Expense[];
}

export function deleteExpense(id: number): boolean {
  const database = getDb();
  const info = database.prepare(`DELETE FROM expenses WHERE id = ?`).run(id);
  return info.changes > 0;
}

