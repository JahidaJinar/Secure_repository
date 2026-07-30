const express = require('express');
const router = express.Router();
const multer = require('multer');
const googleDriveService = require('../services/googleDriveService');

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Upload client-encrypted file payload
router.post('/upload', upload.single('encryptedFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file payload received' });
    }

    const uploadResult = await googleDriveService.uploadEncryptedFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      fileId: uploadResult.fileId,
      fileName: uploadResult.fileName,
      driveUrl: uploadResult.driveUrl,
      storageType: uploadResult.storageType
    });
  } catch (err) {
    console.error('File Upload Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Download client-encrypted file by fileId
router.get('/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;

    // Provide sample dummy data if sample-file-1, 2, etc. are requested for demo
    if (fileId.startsWith('sample-file-')) {
      const sampleText = `[ENCRYPTED_PAYLOAD_SAMPLE_${fileId}] - Client-side CryptoJS encrypted binary data simulation payload for testing decryption.`;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileId}.enc"`);
      return res.send(Buffer.from(sampleText));
    }

    const fileBuffer = await googleDriveService.getEncryptedFile(fileId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileId}.enc"`);
    res.send(fileBuffer);
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
});

module.exports = router;
