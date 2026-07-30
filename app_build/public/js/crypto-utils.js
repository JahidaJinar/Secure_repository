/**
 * EdTech Secure Project Repository - Client-Side AES-256 CryptoJS Encryption Module
 * Zero-Knowledge Architecture: Passwords never leave the browser client.
 */

const CryptoUtils = {
  /**
   * Convert ArrayBuffer to CryptoJS WordArray
   */
  arrayBufferToWordArray(ab) {
    const i8a = new Uint8Array(ab);
    const words = [];
    for (let i = 0; i < i8a.length; i += 4) {
      words.push(
        (i8a[i] << 24) |
        ((i8a[i + 1] || 0) << 16) |
        ((i8a[i + 2] || 0) << 8) |
        (i8a[i + 3] || 0)
      );
    }
    return CryptoJS.lib.WordArray.create(words, i8a.length);
  },

  /**
   * Convert CryptoJS WordArray to Uint8Array / ArrayBuffer
   */
  wordArrayToUint8Array(wordArray) {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const u8 = new Uint8Array(sigBytes);
    let offset = 0;
    for (let i = 0; i < sigBytes; i++) {
      const byte = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      u8[offset++] = byte;
    }
    return u8;
  },

  /**
   * Client-side AES-256 Encrypt File
   * @param {File} file - Original file object selected by user
   * @param {string} password - User provided secret key
   * @returns {Promise<{ encryptedBlob: Blob, originalName: string, mimeType: string }>}
   */
  async encryptFile(file, password) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const wordArray = CryptoUtils.arrayBufferToWordArray(arrayBuffer);

          // AES-256 Encryption with Password
          const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();

          // Create metadata envelope to preserve original filename & type inside encrypted container
          const passwordHash = CryptoJS.SHA256(password + "_edtech_sec_salt").toString().substring(0, 32);
          const payloadEnvelope = JSON.stringify({
            originalName: file.name,
            mimeType: file.type || 'application/octet-stream',
            cipherText: encrypted,
            checksum: passwordHash
          });

          const encryptedBlob = new Blob([payloadEnvelope], { type: 'application/json' });
          resolve({
            encryptedBlob,
            originalName: file.name,
            mimeType: file.type
          });
        } catch (err) {
          reject(new Error('AES-256 Encryption failed: ' + err.message));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file from disk'));
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Client-side AES-256 Decrypt Payload
   * @param {string|ArrayBuffer} encryptedData - Downloaded encrypted payload string or buffer
   * @param {string} password - User entered secret key
   * @returns {{ blob: Blob, originalName: string }}
   */
  decryptFilePayload(encryptedDataText, password) {
    let payload;
    try {
      payload = JSON.parse(encryptedDataText);
    } catch (e) {
      // Fallback if raw ciphertext without JSON envelope
      payload = {
        originalName: 'decrypted_project_file',
        mimeType: 'application/octet-stream',
        cipherText: encryptedDataText
      };
    }

    // Strict author password verification
    if (payload.checksum) {
      const expectedChecksum = CryptoJS.SHA256(password + "_edtech_sec_salt").toString().substring(0, 32);
      if (payload.checksum !== expectedChecksum) {
        throw new Error('Incorrect password! Must enter exact password set by author.');
      }
    }

    try {
      const decryptedWordArray = CryptoJS.AES.decrypt(payload.cipherText, password);
      
      if (!decryptedWordArray || decryptedWordArray.sigBytes <= 0) {
        throw new Error('Incorrect password! Must enter exact password set by author.');
      }

      const uint8Array = CryptoUtils.wordArrayToUint8Array(decryptedWordArray);
      if (!uint8Array || uint8Array.length === 0) {
        throw new Error('Incorrect password! Must enter exact password set by author.');
      }

      const blob = new Blob([uint8Array], { type: payload.mimeType || 'application/octet-stream' });

      return {
        blob,
        originalName: payload.originalName || 'decrypted_file'
      };
    } catch (err) {
      throw new Error('Incorrect password! Must enter exact password set by author.');
    }
  },

  /**
   * Helper to trigger browser download for a Blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
