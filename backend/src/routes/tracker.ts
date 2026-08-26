import { Router, Request, Response } from 'express';
import { PrismaClient, Ipo, Application, Applicant } from '@prisma/client';
import { decrypt, maskPan } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const iposWithApplications = await prisma.ipo.findMany({
      include: {
        applications: {
          include: {
            applicant: true,
          }
        }
      },
      orderBy: { openDate: 'desc' }
    });

    const mapped = iposWithApplications.map((ipo: Ipo & { applications: (Application & { applicant: Applicant | null })[] }) => {
      ipo.applications.forEach((app: Application & { applicant: Applicant | null }) => {
        if (app.applicant) {
          app.applicant.panEncrypted = maskPan(decrypt(app.applicant.panEncrypted));
        }
      });
      return ipo;
    });

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching tracker data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
