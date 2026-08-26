import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all capital transactions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const transactions = await prisma.capitalTransaction.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching capital transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new capital transaction
router.post('/', async (req: AuthRequest, res: Response) => {
  const { type, amount, reason } = req.body;

  if (type !== 'add' && type !== 'withdraw') {
    return res.status(400).json({ error: "Type must be 'add' or 'withdraw'" });
  }

  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number or zero' });
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const transaction = await prisma.capitalTransaction.create({
      data: {
        type,
        amount,
        reason: reason.trim()
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating capital transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
