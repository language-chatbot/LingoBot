import express from 'express';
import prisma from '../services/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Retrieve all students (Admin only)
router.get('/students', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        groups: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(students);
  } catch (error) {
    console.error('Fetch student list error:', error);
    res.status(500).json({ error: 'Failed to fetch student list.' });
  }
});

// Retrieve activity completion & chat logs (Admin only)
// Supports filtering by groupId, studentId, and activityId
router.get('/logs', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const { groupId, studentId, activityId } = req.query;

  try {
    // 1. Build log filter clauses
    const activityFilter = {};
    if (groupId) activityFilter.groupId = parseInt(groupId);
    if (activityId) activityFilter.id = parseInt(activityId);

    const userFilter = { role: 'STUDENT' };
    if (studentId) userFilter.id = parseInt(studentId);
    if (groupId) userFilter.groups = { some: { id: parseInt(groupId) } };

    // 2. Fetch activity log summaries
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        studentId: studentId ? parseInt(studentId) : undefined,
        activity: (groupId || activityId) ? {
          groupId: groupId ? parseInt(groupId) : undefined,
          id: activityId ? parseInt(activityId) : undefined
        } : undefined
      },
      include: {
        student: { select: { name: true, email: true } },
        activity: {
          include: { group: { select: { name: true } } }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    // 3. Fetch chat logs matching filters
    const chatLogs = await prisma.chatLog.findMany({
      where: {
        studentId: studentId ? parseInt(studentId) : undefined,
        activity: (groupId || activityId) ? {
          groupId: groupId ? parseInt(groupId) : undefined,
          id: activityId ? parseInt(activityId) : undefined
        } : undefined
      },
      include: {
        student: { select: { name: true, email: true } },
        activity: {
          include: { group: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Cap chat history return counts to avoid overloading
    });

    res.json({
      activityLogs,
      chatLogs
    });
  } catch (error) {
    console.error('Fetch system audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs data.' });
  }
});

// Fetch high-level statistics for Admin Dashboard metrics cards
router.get('/stats', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  try {
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalGroups = await prisma.group.count();
    const totalActivities = await prisma.activity.count();

    // Calculate completions rate
    const totalLogs = await prisma.activityLog.count();
    const completedLogs = await prisma.activityLog.count({ where: { status: 'COMPLETED' } });
    const completionRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

    // Fetch progress counts breakdown
    const notStartedCount = totalStudents * totalActivities - totalLogs; // Simple estimation
    const inProgressCount = await prisma.activityLog.count({ where: { status: 'IN_PROGRESS' } });

    res.json({
      totalStudents,
      totalGroups,
      totalActivities,
      completionRate,
      statusBreakdown: {
        notStarted: notStartedCount > 0 ? notStartedCount : 0,
        inProgress: inProgressCount,
        completed: completedLogs
      }
    });
  } catch (error) {
    console.error('Fetch stats summary error:', error);
    res.status(500).json({ error: 'Failed to compile statistics.' });
  }
});

export default router;
