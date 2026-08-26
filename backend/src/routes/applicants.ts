import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { encrypt, decrypt, maskPan } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// Create applicant
router.post('/', async (req: Request, res: Response) => {
  const { name, pan, mobileNumber } = req.body;

  if (!name || !pan || !mobileNumber) {
    return res.status(400).json({ error: 'Name, pan, and mobileNumber are required' });
  }

  try {
    const panEncrypted = encrypt(pan);
    const applicant = await prisma.applicant.create({
      data: {
        name,
        panEncrypted,
        mobileNumber,
      },
    });

    res.status(201).json({
      ...applicant,
      panEncrypted: maskPan(pan) // return masked on create
    });
  } catch (error) {
    console.error('Error creating applicant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List applicants
router.get('/', async (req: Request, res: Response) => {
  try {
    const applicants = await prisma.applicant.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mapped = applicants.map(app => {
      const decryptedPan = decrypt(app.panEncrypted);
      return {
        ...app,
        // The requirement states "decrypt only when explicitly requested via a ?reveal=true query param; by default return only last 4 characters of PAN"
        panEncrypted: req.query.reveal === 'true' ? decryptedPan : maskPan(decryptedPan)
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single applicant
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: req.params.id }
    });

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const decryptedPan = decrypt(applicant.panEncrypted);
    res.json({
      ...applicant,
      panEncrypted: req.query.reveal === 'true' ? decryptedPan : maskPan(decryptedPan)
    });
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update applicant
router.put('/:id', async (req: Request, res: Response) => {
  const { name, pan, mobileNumber } = req.body;

  try {
    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (pan) updateData.panEncrypted = encrypt(pan);

    const applicant = await prisma.applicant.update({
      where: { id: req.params.id },
      data: updateData
    });

    const decryptedPan = decrypt(applicant.panEncrypted);
    res.json({
      ...applicant,
      panEncrypted: maskPan(decryptedPan)
    });
  } catch (error) {
    console.error('Error updating applicant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete applicant
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.applicant.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error: unknown) {
    if (
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') ||
      (error instanceof Prisma.PrismaClientUnknownRequestError && error.message.includes('foreign key constraint'))
    ) {
      const appCount = await prisma.application.count({ where: { applicantId: req.params.id } });
      return res.status(400).json({ 
        error: `Cannot delete this applicant because they have ${appCount} existing IPO application(s). Delete or reassign those applications first.` 
      });
    }
    console.error('Error deleting applicant:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
