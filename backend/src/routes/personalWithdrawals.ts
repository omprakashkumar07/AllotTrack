import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all personal withdrawals
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const withdrawals = await prisma.personalWithdrawal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(withdrawals);
  } catch (error) {
    console.error('Error fetching personal withdrawals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new personal withdrawal
router.post('/', async (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body;

  if (typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ error: 'Amount must be a positive number or zero' });
  }

  if (typeof reason !== 'string' || reason.trim() === '') {
    return res.status(400).json({ error: 'Reason is required' });
  }

  try {
    const withdrawal = await prisma.personalWithdrawal.create({
      data: {
        amount,
        reason: reason.trim()
      }
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    console.error('Error creating personal withdrawal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
