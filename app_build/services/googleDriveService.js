const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    this.initDrive();
  }

  initDrive() {
    try {
      const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
      const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY
        ? process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n')
        : null;

      if (clientEmail && privateKey) {
        const auth = new google.auth.JWT(
          clientEmail,
          null,
          privateKey,
          ['https://www.googleapis.com/auth/drive.file']
        );
        this.drive = google.drive({ version: 'v3', auth });
        console.log('✅ Google Drive API initialized successfully.');
      } else {
        console.log('ℹ️ Google Drive API credentials not provided. Using local cloud storage fallback.');
      }
    } catch (err) {
      console.warn('⚠️ Could not initialize Google Drive API, using local storage fallback:', err.message);
    }
  }

  async uploadEncryptedFile(fileBuffer, originalName, mimeType) {
    const fileId = uuidv4();
    const storedFileName = `${fileId}_${originalName}.enc`;

    if (this.drive) {
      try {
        const fileMetadata = {
          name: storedFileName,
          parents: this.folderId ? [this.folderId] : [],
        };
        const media = {
          mimeType: 'application/octet-stream',
          body: fs.createReadStream(this.getTempPath(fileBuffer, storedFileName)),
        };

        const response = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, webViewLink, webContentLink',
        });

        // Make file readable if needed
        try {
          await this.drive.permissions.create({
            fileId: response.data.id,
            requestBody: { role: 'reader', type: 'anyone' }
          });
        } catch (permErr) {
          // ignore permission error if service account restricted
        }

        return {
          fileId: response.data.id,
          fileName: originalName,
          driveUrl: response.data.webContentLink || `/api/drive/download/${response.data.id}`,
          storageType: 'google_drive'
        };
      } catch (err) {
        console.error('Google Drive API upload error, falling back to local:', err.message);
      }
    }

    // Local Cloud Storage Fallback
    const localFilePath = path.join(UPLOADS_DIR, storedFileName);
    fs.writeFileSync(localFilePath, fileBuffer);

    return {
      fileId: fileId,
      fileName: originalName,
      driveUrl: `/api/drive/download/${fileId}`,
      storageType: 'local_cloud'
    };
  }

  getTempPath(buffer, filename) {
    const tempPath = path.join(UPLOADS_DIR, `temp_${filename}`);
    fs.writeFileSync(tempPath, buffer);
    return tempPath;
  }

  async getEncryptedFile(fileId) {
    if (this.drive) {
      try {
        const response = await this.drive.files.get(
          { fileId: fileId, alt: 'media' },
          { responseType: 'arraybuffer' }
        );
        return Buffer.from(response.data);
      } catch (err) {
        console.error('Failed to download from Google Drive, checking local:', err.message);
      }
    }

    // Check local storage fallback
    const files = fs.readdirSync(UPLOADS_DIR);
    const targetFile = files.find(f => f.startsWith(fileId));
    if (targetFile) {
      const filePath = path.join(UPLOADS_DIR, targetFile);
      return fs.readFileSync(filePath);
    }

    throw new Error('Encrypted file not found in storage.');
  }
}

module.exports = new GoogleDriveService();
