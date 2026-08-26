import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const rawKey = process.env.PAN_ENCRYPTION_KEY || 'default-32-char-key-replace-this!!';
// Decode as hex if it's a 64-char hex string, otherwise fallback to utf8 string
const ENCRYPTION_KEY = Buffer.from(rawKey, rawKey.length === 64 ? 'hex' : 'utf8');
const IV_LENGTH = 16; // For AES, this is always 16

if (ENCRYPTION_KEY.length !== 32) {
  console.warn('⚠️ WARNING: PAN_ENCRYPTION_KEY is not 32 bytes long! AES-256-CBC requires a 32-byte key.');
}

/**
 * Encrypts a string (e.g., PAN number)
 * Returns format: iv:encryptedData
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an encrypted string of format: iv:encryptedData
 */
export function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    console.error('Decryption error:', e);
    return 'DECRYPTION_FAILED';
  }
}

/**
 * Masks a PAN number, showing only the last 4 characters
 */
export function maskPan(pan: string): string {
  if (pan.length <= 4) return pan;
  return '*'.repeat(pan.length - 4) + pan.slice(-4);
}
