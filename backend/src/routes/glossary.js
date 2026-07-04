import express from 'express';
import prisma from '../services/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Fetch glossary terms for a specific content item
router.get('/content/:contentId', authenticateToken, async (req, res) => {
  const contentId = parseInt(req.params.contentId);
  try {
    const terms = await prisma.glossaryTerm.findMany({
      where: { contentId },
      orderBy: { startOffset: 'asc' }
    });
    res.json(terms);
  } catch (error) {
    console.error('Fetch glossary terms error:', error);
    res.status(500).json({ error: 'Failed to fetch glossary terms.' });
  }
});

// Create/Tag new glossary term definition (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const { contentId, term, definition, startOffset, endOffset } = req.body;

  if (!contentId || !term || !definition || startOffset === undefined || endOffset === undefined) {
    return res.status(400).json({
      error: 'contentId, term, definition, startOffset, and endOffset are required.'
    });
  }

  try {
    // Verify target content existence
    const content = await prisma.content.findUnique({
      where: { id: parseInt(contentId) }
    });

    if (!content) {
      return res.status(404).json({ error: 'Associated content library entry not found.' });
    }

    const glossaryTerm = await prisma.glossaryTerm.create({
      data: {
        contentId: parseInt(contentId),
        term,
        definition,
        startOffset: parseInt(startOffset),
        endOffset: parseInt(endOffset)
      }
    });

    res.status(201).json(glossaryTerm);
  } catch (error) {
    console.error('Create glossary term error:', error);
    res.status(500).json({ error: 'Failed to save glossary term definition.' });
  }
});

// Delete tagged glossary term (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const termId = parseInt(req.params.id);
  try {
    await prisma.glossaryTerm.delete({
      where: { id: termId }
    });
    res.json({ message: 'Glossary term definition deleted successfully.' });
  } catch (error) {
    console.error('Delete glossary term error:', error);
    res.status(500).json({ error: 'Failed to delete glossary term definition.' });
  }
});

export default router;
