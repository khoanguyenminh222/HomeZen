import crypto from 'crypto';

/**
 * Encryption Service
 * Sử dụng AES-256-GCM để mã hóa dữ liệu nhạy cảm
 * Requirements: 1.5, 2.5, 5.1, 5.3, 5.4
 */
class AESEncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.saltLength = 64; // 512 bits
  }

  /**
   * Lấy encryption key từ environment variable
   * @returns {Buffer} Encryption key
   */
  getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Key phải có độ dài 64 ký tự (32 bytes hex) hoặc 32 bytes
    if (key.length === 64) {
      // Hex string, convert to buffer
      return Buffer.from(key, 'hex');
    } else if (key.length === 32) {
      // Direct bytes
      return Buffer.from(key, 'utf8');
    } else {
      // Hash key to 32 bytes
      return crypto.createHash('sha256').update(key).digest();
    }
  }

  /**
   * Mã hóa plaintext
   * @param {string} plaintext - Dữ liệu cần mã hóa
   * @returns {Promise<string>} Encrypted data (format: iv:tag:encryptedData)
   */
  async encrypt(plaintext) {
    if (!plaintext || typeof plaintext !== 'string') {
      throw new Error('Plaintext must be a non-empty string');
    }

    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Format: iv:tag:encryptedData (all in hex)
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Giải mã ciphertext
   * @param {string} ciphertext - Dữ liệu đã mã hóa (format: iv:tag:encryptedData)
   * @returns {Promise<string>} Decrypted plaintext
   */
  async decrypt(ciphertext) {
    if (!ciphertext || typeof ciphertext !== 'string') {
      throw new Error('Ciphertext must be a non-empty string');
    }

    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format');
      }

      const [ivHex, tagHex, encrypted] = parts;
      const key = this.getKey();
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Tạo encryption key mới (32 bytes random)
   * @returns {string} Hex-encoded key (64 characters)
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Validate encryption key format
   * @param {string} key - Key to validate
   * @returns {boolean} True if key is valid
   */
  validateKey(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    // Key có thể là:
    // - 64 hex characters (32 bytes)
    // - 32 characters (direct bytes)
    // - Any length (will be hashed)
    return key.length > 0;
  }
}

// Export singleton instance
export const encryptionService = new AESEncryptionService();

// Export class for testing
export { AESEncryptionService };
