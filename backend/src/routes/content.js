import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../services/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { processUploadedFile } from '../services/storageService.js';

const router = express.Router();

// Define local assets uploads directory
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configurations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // Limit: 100MB
});

// Create learning content metadata (supporting textual articles or physical files)
router.post('/', authenticateToken, requireRole('ADMIN'), upload.single('file'), async (req, res) => {
  const { type, textBody } = req.body;

  if (!type || !['READING', 'LISTENING', 'VIDEO'].includes(type)) {
    return res.status(400).json({ error: 'Valid content type (READING, LISTENING, VIDEO) is required.' });
  }

  try {
    let fileUrl = null;

    if (type === 'READING') {
      if (!textBody) {
        return res.status(400).json({ error: 'textBody content is required for Reading activities.' });
      }
    } else {
      // Audio or Video: file must be uploaded
      if (!req.file) {
        return res.status(400).json({ error: `An media file upload is required for ${type} content.` });
      }
      // Delegate file processing (S3 upload vs local retention)
      fileUrl = await processUploadedFile(req.file);
    }

    const content = await prisma.content.create({
      data: {
        type,
        textBody: type === 'READING' ? textBody : null,
        fileUrl: type !== 'READING' ? fileUrl : null
      }
    });

    res.status(201).json(content);
  } catch (error) {
    console.error('Content creation error:', error);
    res.status(500).json({ error: 'Failed to create content database registry.' });
  }
});

// List all files/texts stored in content library (Admin view)
router.get('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const contents = await prisma.content.findMany({
      include: {
        _count: {
          select: { activities: true, glossaryTerms: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(contents);
  } catch (error) {
    console.error('Content list retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve content list.' });
  }
});

// Fetch detailed content model metadata
router.get('/:id', authenticateToken, async (req, res) => {
  const contentId = parseInt(req.params.id);
  try {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: { glossaryTerms: true }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content entry not found.' });
    }

    res.json(content);
  } catch (error) {
    console.error('Fetch content entry details error:', error);
    res.status(500).json({ error: 'Failed to fetch content entry details.' });
  }
});

// Delete content records and assets from local disk if available
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const contentId = parseInt(req.params.id);
  try {
    const content = await prisma.content.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      return res.status(404).json({ error: 'Content entry not found.' });
    }

    // If local asset path exists, clean it up
    if (content.fileUrl && content.fileUrl.startsWith('/uploads/')) {
      const filename = content.fileUrl.replace('/uploads/', '');
      const filePath = path.join(uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.content.delete({ where: { id: contentId } });
    res.json({ message: 'Content resource deleted successfully.' });
  } catch (error) {
    console.error('Content removal error:', error);
    res.status(500).json({ error: 'Failed to delete content resource.' });
  }
});

export default router;
