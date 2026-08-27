import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

// IPOCentral Cache Configuration
let ipoListCache: any[] | null = null;
let ipoListCacheTime = 0;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Fetch External - List
router.get('/fetch-external/list', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    if (ipoListCache && (now - ipoListCacheTime < CACHE_DURATION_MS)) {
      return res.json({ success: true, fromCache: true, ipos: ipoListCache });
    }

    const response = await axios.get('https://ipocentral.in/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const table = $('table').first();
    const ipos: any[] = [];
    
    if (table.length > 0) {
      table.find('tr').each((i, row) => {
        const firstCell = $(row).find('td').first();
        const aTag = firstCell.find('a');
        if (aTag.length > 0) {
          const name = aTag.text().trim();
          const detailUrl = aTag.attr('href');
          const priceBand = $(row).find('td').eq(2).text().trim();
          ipos.push({ name, priceBand, detailUrl });
        }
      });
    }

    ipoListCache = ipos;
    ipoListCacheTime = now;
    res.json({ success: true, fromCache: false, ipos });
  } catch (error) {
    console.error('Error fetching external IPO list:', error);
    res.status(500).json({ error: 'Failed to fetch IPO list from external source' });
  }
});

// Deterministic manual date parser: "1 September 2026"
const parseExplicitDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.toLowerCase().includes('coming soon')) return null;
  // e.g., "1 September 2026" or "01 Sep 2026"
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    let yearStr = parts[parts.length - 1];
    // Sometime time/timezone is appended, grab the first 4-digit year looking token
    const yearMatch = dateStr.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : parseInt(yearStr, 10);
    
    const monthStr = parts[1].toLowerCase().substring(0, 3);
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    
    const monthIndex = monthMap[monthStr];
    
    if (!isNaN(day) && !isNaN(year) && monthIndex !== undefined) {
      // Create UTC date to avoid timezone shifts when saving
      const d = new Date(Date.UTC(year, monthIndex, day));
      return d.toISOString();
    }
  }
  return null;
};

// Fetch External - Detail
router.get('/fetch-external/detail', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'URL parameter is required' });

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    let lotSize: number | null = null;
    let openDate: string | null = null;
    let closeDate: string | null = null;
    let allotmentDate: string | null = null;
    let listingDate: string | null = null;
    let gmp: number | null = null;
    
    $('table').each((i, tab) => {
      const firstRowCols = $(tab).find('tr').first().find('td, th');
      let gmpColIdx = -1;
      firstRowCols.each((k, col) => {
        if ($(col).text().toLowerCase().includes('gmp')) {
          gmpColIdx = k;
        }
      });
      if (gmpColIdx !== -1 && gmp === null) {
        const secondRow = $(tab).find('tr').eq(1);
        if (secondRow.length > 0) {
           const gmpText = secondRow.find('td, th').eq(gmpColIdx).text().trim().replace(/,/g, '');
           const parsed = parseFloat(gmpText);
           if (!isNaN(parsed)) gmp = parsed;
        }
      }

      $(tab).find('tr').each((j, row) => {
        const key = $(row).find('td').first().text().toLowerCase().trim();
        const value = $(row).find('td').eq(1).text().trim();
        
        if (key.includes('minimum bid') || key.includes('lot size')) {
          const numMatch = value.match(/^\s*(\d+)/);
          if (numMatch) lotSize = parseInt(numMatch[1], 10);
        } else if (key.includes('opening date') && !openDate) {
          openDate = parseExplicitDate(value);
        } else if (key.includes('closing date') && !closeDate) {
          closeDate = parseExplicitDate(value);
        } else if (key.includes('basis of allotment') && !allotmentDate) {
          allotmentDate = parseExplicitDate(value);
        } else if (key.includes('listing date') && !listingDate) {
          listingDate = parseExplicitDate(value);
        }
      });
    });

    res.json({
      success: true,
      details: { lotSize, openDate, closeDate, allotmentDate, listingDate, gmp }
    });
  } catch (error) {
    console.error('Error fetching external IPO detail:', error);
    res.status(500).json({ error: 'Failed to fetch IPO detail from external source' });
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
