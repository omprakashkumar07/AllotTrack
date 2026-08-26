import { Router, Request, Response } from 'express';
import { PrismaClient, FundTransaction, Applicant } from '@prisma/client';
import { decrypt, maskPan } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// List all transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.fundTransaction.findMany({
      include: {
        applicant: true,
      },
      orderBy: { date: 'desc' }
    });
    const mapped = transactions.map((tx: FundTransaction & { applicant: Applicant | null }) => {
      if (tx.applicant) {
        tx.applicant.panEncrypted = maskPan(decrypt(tx.applicant.panEncrypted));
      }
      return tx;
    });
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching fund transactions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create a transaction
router.post('/', async (req: Request, res: Response) => {
  if (req.body.amount !== undefined && (typeof req.body.amount !== 'number' || req.body.amount < 0)) {
    return res.status(400).json({ error: 'amount must be a number greater than or equal to 0' });
  }

  try {
    const transaction = await prisma.fundTransaction.create({
      data: req.body,
      include: {
        applicant: true,
      }
    });
    if (transaction.applicant) {
      transaction.applicant.panEncrypted = maskPan(decrypt(transaction.applicant.panEncrypted));
    }
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating fund transaction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update a transaction
router.put('/:id', async (req: Request, res: Response) => {
  if (req.body.amount !== undefined && (typeof req.body.amount !== 'number' || req.body.amount < 0)) {
    return res.status(400).json({ error: 'amount must be a number greater than or equal to 0' });
  }

  try {
    const transaction = await prisma.fundTransaction.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        applicant: true,
      }
    });
    if (transaction.applicant) {
      transaction.applicant.panEncrypted = maskPan(decrypt(transaction.applicant.panEncrypted));
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error updating fund transaction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a transaction
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.fundTransaction.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting fund transaction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
