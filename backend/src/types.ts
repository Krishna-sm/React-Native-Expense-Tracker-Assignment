export type Category =
  | 'Food & Dining'
  | 'Transport'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Health'
  | 'Travel'
  | 'Other';

export interface ParsedExpense {
  amount: number;
  currency: string;
  category: Category;
  description: string;
  merchant: string | null;
}

export interface Expense extends ParsedExpense {
  id: number;
  original_input: string;
  created_at: string; // ISO string
}

export interface ExpenseInput extends ParsedExpense {
  original_input: string;
}

