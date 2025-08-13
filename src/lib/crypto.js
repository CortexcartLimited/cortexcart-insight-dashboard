// src/lib/crypto.js
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // Get key from environment variables

if (KEY.length !== 32) {
    throw new Error('Invalid ENCRYPTION_KEY length. Must be a 64-character hex string (32 bytes).');
}

/**
 * Encrypts a piece of text.
 * @param {string} text - The text to encrypt.
 * @returns {string} - The encrypted string, formatted as "iv:encryptedData:authTag".
 */
export function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a piece of text.
 * @param {string} text - The encrypted text in "iv:encryptedData:authTag" format.
 * @returns {string} - The decrypted text.
 */
export function decrypt(text) {
    try {
        const parts = text.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format.');
        }
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const authTag = Buffer.from(parts[2], 'hex');

        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error.message);
        // Return null or an empty string to prevent leaking error details
        return null; 
    }
}
