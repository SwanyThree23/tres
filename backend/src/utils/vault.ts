/**
 * SwanyThree Vault Pro
 * AES-256-GCM encryption/decryption for secure storage of
 * API keys, stream keys, and other credentials.
 */

import crypto from 'crypto';

const getVaultKey = (): Buffer => {
  const key = process.env.VAULT_MASTER_KEY;
  if (!key) {
    throw new Error('VAULT_MASTER_KEY environment variable is not set');
  }
  return Buffer.from(key, 'hex');
};

export const Vault = {
  /**
   * Encrypt data using AES-256-GCM.
   * Returns an object with iv, encrypted content, and auth tag.
   */
  encrypt(data: string): { iv: string; content: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = getVaultKey();
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  },

  /**
   * Decrypt data using AES-256-GCM.
   * Expects a colon-delimited string: iv:content:tag
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length < 3) {
      throw new Error('Invalid encrypted data format. Expected iv:content:tag');
    }

    const [ivHex, contentHex, tagHex] = parts;
    const key = getVaultKey();
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    return Buffer.concat([
      decipher.update(Buffer.from(contentHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  },
};
