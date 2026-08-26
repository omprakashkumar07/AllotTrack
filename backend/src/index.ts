import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from './middleware/auth';
import applicantsRouter from './routes/applicants';
import iposRouter from './routes/ipos';
import applicationsRouter from './routes/applications';
import fundTransactionsRouter from './routes/fundTransactions';
import trackerRouter from './routes/tracker';

import capitalTransactionsRouter from './routes/capitalTransactions';
import personalWithdrawalsRouter from './routes/personalWithdrawals';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const prisma = new PrismaClient();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Public login route
app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protect all routes below this middleware
app.use(authMiddleware);

app.use('/api/applicants', applicantsRouter);
app.use('/api/ipos', iposRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/fund-transactions', fundTransactionsRouter);
app.use('/api/tracker', trackerRouter);

app.use('/api/capital-transactions', capitalTransactionsRouter);
app.use('/api/personal-withdrawals', personalWithdrawalsRouter);

// Protected hello world route
app.get('/api/protected', (req: AuthRequest, res: Response) => {
  res.json({ message: 'Hello from the protected Express Backend!', user: req.user });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
