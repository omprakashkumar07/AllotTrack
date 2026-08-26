import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { decrypt, maskPan } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// List all applications (optionally filter by ipoId or applicantId)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { ipoId, applicantId } = req.query;
    
    const where: any = {};
    if (ipoId) where.ipoId = String(ipoId);
    if (applicantId) where.applicantId = String(applicantId);

    const applications = await prisma.application.findMany({
      where,
      include: {
        applicant: true,
        ipo: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    const mapped = applications.map(app => {
      if (app.applicant) {
        app.applicant.panEncrypted = maskPan(decrypt(app.applicant.panEncrypted));
      }
      return app;
    });
    res.json(mapped);
  } catch (_error: unknown) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single application
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        applicant: true,
        ipo: true,
      }
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.applicant) {
      application.applicant.panEncrypted = maskPan(decrypt(application.applicant.panEncrypted));
    }
    res.json(application);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create an application
router.post('/', async (req: Request, res: Response) => {
  if (req.body.amountSent !== undefined && (typeof req.body.amountSent !== 'number' || req.body.amountSent < 0)) {
    return res.status(400).json({ error: 'amountSent must be a number greater than or equal to 0' });
  }

  try {
    const application = await prisma.application.create({
      data: req.body,
      include: {
        applicant: true,
        ipo: true
      }
    });

    await prisma.fundTransaction.create({
      data: {
        applicantId: application.applicantId,
        applicationId: application.id,
        type: 'sent',
        amount: application.amountTransferred ?? application.amountSent,
        notes: `Application for IPO: ${application.ipo.name}`
      }
    });

    if (application.applicant) {
      application.applicant.panEncrypted = maskPan(decrypt(application.applicant.panEncrypted));
    }

    res.status(201).json(application);
  } catch (_error: unknown) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an application
router.put('/:id', async (req: Request, res: Response) => {
  if (req.body.amountSent !== undefined && (typeof req.body.amountSent !== 'number' || req.body.amountSent < 0)) {
    return res.status(400).json({ error: 'amountSent must be a number greater than or equal to 0' });
  }
  if (req.body.amountReceivedBack !== undefined && req.body.amountReceivedBack !== null && (typeof req.body.amountReceivedBack !== 'number' || req.body.amountReceivedBack < 0)) {
    return res.status(400).json({ error: 'amountReceivedBack must be a number greater than or equal to 0' });
  }
  if (req.body.sharesAllotted !== undefined && req.body.sharesAllotted !== null && (typeof req.body.sharesAllotted !== 'number' || req.body.sharesAllotted < 0)) {
    return res.status(400).json({ error: 'sharesAllotted must be a non-negative integer' });
  }

  try {
    const existing = await prisma.application.findUnique({ 
      where: { id: req.params.id },
      include: { ipo: true }
    });

    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        applicant: true,
        ipo: true
      }
    });

    if (existing) {
      // Sync sent amount
      if (req.body.amountSent !== undefined || req.body.amountTransferred !== undefined) {
        const newSentAmount = req.body.amountTransferred ?? application.amountTransferred ?? req.body.amountSent ?? application.amountSent;
        const sentTx = await prisma.fundTransaction.findFirst({
          where: { applicationId: application.id, type: 'sent' }
        });
        if (sentTx && sentTx.amount !== newSentAmount) {
          await prisma.fundTransaction.update({
            where: { id: sentTx.id },
            data: { amount: newSentAmount }
          });
        }
      }

      // Sync received amount based on receivedFromApplicant
      if (req.body.receivedFromApplicant !== undefined || req.body.amountReceivedFromApplicant !== undefined) {
        const receivedTx = await prisma.fundTransaction.findFirst({
          where: { applicationId: application.id, type: 'received' }
        });
        
        if (application.receivedFromApplicant && application.amountReceivedFromApplicant !== null) {
          if (receivedTx) {
            await prisma.fundTransaction.update({
              where: { id: receivedTx.id },
              data: { amount: application.amountReceivedFromApplicant }
            });
          } else {
            await prisma.fundTransaction.create({
              data: {
                applicantId: application.applicantId,
                applicationId: application.id,
                type: 'received',
                amount: application.amountReceivedFromApplicant,
                notes: `Settlement for IPO: ${application.ipo.name}`
              }
            });
          }
        } else if (!application.receivedFromApplicant && receivedTx) {
          // If it was toggled off, delete the transaction
          await prisma.fundTransaction.delete({
            where: { id: receivedTx.id }
          });
        }
      }
    }

    if (application.applicant) {
      application.applicant.panEncrypted = maskPan(decrypt(application.applicant.panEncrypted));
    }

    res.json(application);
  } catch (_error: unknown) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete an application
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.application.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (_error: unknown) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
