import { Router } from 'express';
import { z } from 'zod';
import { parseExpense } from '../services/ai';
import { createExpense, deleteExpense, getAllExpenses } from '../database/db';

export const expensesRouter = Router();

const CreateBody = z.object({
  input: z.string().min(1),
});

expensesRouter.post('/', async (req, res) => {
  const bodyParsed = CreateBody.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  try {
    const parsed = await parseExpense(bodyParsed.data.input);
    if ('error' in parsed) {
      return res.status(400).json({ success: false, error: parsed.error });
    }

    const expense = createExpense({
      ...parsed,
      original_input: bodyParsed.data.input,
    });

    return res.status(201).json({ success: true, expense });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

expensesRouter.get('/', (_req, res) => {
  try {
    const expenses = getAllExpenses();
    return res.status(200).json({ success: true, expenses });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

expensesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
    const ok = deleteExpense(id);
    if (!ok) return res.status(404).json({ success: false, error: 'Expense not found' });
    return res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

