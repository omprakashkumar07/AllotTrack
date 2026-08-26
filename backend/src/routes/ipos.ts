import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();
const prisma = new PrismaClient();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || 'missing-key' 
});

// Helper to safely parse dates
const parseDate = (d: string | null | undefined): Date | null => {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
};

// Fetch Live IPOs using Gemini API
router.post('/fetch-live', async (req: Request, res: Response) => {
  try {
    const prompt = `Search the web for currently OPEN or UPCOMING "mainboard" IPOs in India right now. 
      Respond with ONLY a valid JSON array, no markdown formatting, no extra text.
      The JSON array must match this exact shape:
      [{
        "name": "string",
        "category": "mainboard",
        "openDate": "ISO-8601 string or null",
        "closeDate": "ISO-8601 string or null",
        "allotmentDate": "ISO-8601 string or null",
        "listingDate": "ISO-8601 string or null",
        "priceBand": "string (e.g. ₹100 - ₹105) or null",
        "lotSize": "integer or null",
        "lotValue": "integer or null"
      }]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let rawText = response.text;
    if (!rawText) {
      return res.status(500).json({ error: 'Failed to generate content from Gemini' });
    }

    // Strip markdown code fences
    rawText = rawText.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let iposData;
    try {
      iposData = JSON.parse(rawText);
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', rawText);
      return res.status(500).json({ error: 'Gemini returned invalid JSON format' });
    }

    const results = [];

    for (const ipo of iposData) {
      const existing = await prisma.ipo.findFirst({ where: { name: ipo.name } });
      
      const payload = {
        name: ipo.name,
        category: 'mainboard',
        openDate: parseDate(ipo.openDate),
        closeDate: parseDate(ipo.closeDate),
        allotmentDate: parseDate(ipo.allotmentDate),
        listingDate: parseDate(ipo.listingDate),
        priceBand: ipo.priceBand || null,
        lotSize: ipo.lotSize || null,
        dataSource: 'gemini-grounded',
        lastVerifiedAt: new Date(),
      };

      if (existing) {
        // Update
        const updated = await prisma.ipo.update({
          where: { id: existing.id },
          data: payload,
        });
        results.push(updated);
      } else {
        // Create
        const created = await prisma.ipo.create({
          data: payload,
        });
        results.push(created);
      }
    }

    res.json({ success: true, count: results.length, ipos: results });
  } catch (error) {
    console.error('Error fetching live IPOs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// List all IPOs
router.get('/', async (req: Request, res: Response) => {
  try {
    const ipos = await prisma.ipo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(ipos);
  } catch (_error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single IPO
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ipo = await prisma.ipo.findUnique({
      where: { id: req.params.id }
    });
    if (!ipo) return res.status(404).json({ error: 'IPO not found' });
    res.json(ipo);
  } catch (_error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create an IPO manually
router.post('/', async (req: Request, res: Response) => {
  try {
    const ipo = await prisma.ipo.create({
      data: {
        ...req.body,
        dataSource: 'manual',
        openDate: parseDate(req.body.openDate),
        closeDate: parseDate(req.body.closeDate),
        allotmentDate: parseDate(req.body.allotmentDate),
        listingDate: parseDate(req.body.listingDate),
      }
    });
    res.status(201).json(ipo);
  } catch (_error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update an IPO
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.openDate !== undefined) data.openDate = parseDate(data.openDate);
    if (data.closeDate !== undefined) data.closeDate = parseDate(data.closeDate);
    if (data.allotmentDate !== undefined) data.allotmentDate = parseDate(data.allotmentDate);
    if (data.listingDate !== undefined) data.listingDate = parseDate(data.listingDate);

    const ipo = await prisma.ipo.update({
      where: { id: req.params.id },
      data
    });
    res.json(ipo);
  } catch (_error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete an IPO
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await prisma.ipo.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (_error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
