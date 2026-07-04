import express from 'express';
import prisma from '../services/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { getChatbotResponse } from '../services/openaiService.js';

const router = express.Router();

// Retrieve chat history for the student and a specific activity
router.get('/:activityId', authenticateToken, async (req, res) => {
  const activityId = parseInt(req.params.activityId);
  const studentId = req.user.id; // Only fetch log of current student

  try {
    const chatLogs = await prisma.chatLog.findMany({
      where: {
        studentId,
        activityId
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, role: true, message: true, createdAt: true }
    });

    res.json(chatLogs);
  } catch (error) {
    console.error('Fetch chat logs history error:', error);
    res.status(500).json({ error: 'Failed to retrieve chatbot history.' });
  }
});

// Proxy and log chatbot message submission
router.post('/:activityId', authenticateToken, async (req, res) => {
  const activityId = parseInt(req.params.activityId);
  const { message } = req.body;
  const studentId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  try {
    // 1. Confirm activity exists and student has access
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { content: true }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    if (req.user.role === 'STUDENT') {
      const belongs = await prisma.user.findFirst({
        where: {
          id: req.user.id,
          groups: { some: { id: activity.groupId } }
        }
      });
      if (!belongs) {
        return res.status(403).json({ error: 'Access denied: activity belongs to a different cohort.' });
      }
    }

    // 2. Fetch past conversation log for context history
    const history = await prisma.chatLog.findMany({
      where: { studentId, activityId },
      orderBy: { createdAt: 'asc' },
      take: 20 // Keep context window reasonably light
    });

    // 3. Prepare passage context
    let passageText = '';
    if (activity.content.type === 'READING') {
      passageText = activity.content.textBody || '';
    } else {
      passageText = `This is a media comprehension activity (${activity.content.type}) titled "${activity.title}". The file resource is located at ${activity.content.fileUrl || 'Local disk'}. Please chat with the student about this media resource.`;
    }

    // 4. Save user message to database first
    await prisma.chatLog.create({
      data: {
        studentId,
        activityId,
        role: 'user',
        message: message.trim()
      }
    });

    // 5. Query OpenAI chatbot engine
    const reply = await getChatbotResponse(passageText, history, message.trim());

    // 6. Save assistant's reply to database
    const assistantLog = await prisma.chatLog.create({
      data: {
        studentId,
        activityId,
        role: 'assistant',
        message: reply
      }
    });

    // Ensure student activity log state is set to IN_PROGRESS when starting a chat
    const progressLog = await prisma.activityLog.findFirst({
      where: { studentId, activityId }
    });
    if (!progressLog) {
      await prisma.activityLog.create({
        data: {
          studentId,
          activityId,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });
    }

    res.status(201).json(assistantLog);
  } catch (error) {
    console.error('Chat submission handling error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat response.' });
  }
});

export default router;
