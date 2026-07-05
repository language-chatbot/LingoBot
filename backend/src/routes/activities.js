import express from 'express';
import prisma from '../services/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List activities.
// Admins see all activities; Students see only activities assigned to their cohort, 
// enriched with their personal completion statuses (NOT_STARTED, IN_PROGRESS, COMPLETED).
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'ADMIN') {
      const activeGroupId = req.query.groupId ? parseInt(req.query.groupId) : null;
      const activities = await prisma.activity.findMany({
        where: activeGroupId ? { groupId: activeGroupId } : undefined,
        include: {
          group: { select: { name: true } },
          content: { select: { id: true, type: true, fileUrl: true } }
        },
        orderBy: [
          { groupId: 'asc' },
          { orderIndex: 'asc' }
        ]
      });
      return res.json(activities);
    } else {
      // Student view
      // Read active group from query parameters
      const activeGroupId = req.query.groupId ? parseInt(req.query.groupId) : null;
      if (!activeGroupId) {
        return res.status(400).json({ error: 'Student has not specified an active group cohort.' });
      }

      // Check if student belongs to this group
      const belongs = await prisma.user.findFirst({
        where: {
          id: req.user.id,
          groups: { some: { id: activeGroupId } }
        }
      });
      if (!belongs) {
        return res.status(403).json({ error: 'Access denied: student is not enrolled in this group.' });
      }

      // 1. Get activities for student's group
      const activities = await prisma.activity.findMany({
        where: { groupId: activeGroupId },
        include: {
          content: {
            select: { id: true, type: true, fileUrl: true }
          }
        },
        orderBy: { orderIndex: 'asc' }
      });

      // 2. Fetch student's completion logs for these activities
      const logs = await prisma.activityLog.findMany({
        where: {
          studentId: req.user.id,
          activityId: { in: activities.map(a => a.id) }
        }
      });

      // Map logs to activities (prioritizing COMPLETED status if duplicates exist)
      const enrichedActivities = activities.map(activity => {
        const activityLogs = logs.filter(l => l.activityId === activity.id);
        const completedLog = activityLogs.find(l => l.status === 'COMPLETED');
        const inProgressLog = activityLogs.find(l => l.status === 'IN_PROGRESS');
        const log = completedLog || inProgressLog;

        return {
          ...activity,
          status: log ? log.status : 'NOT_STARTED',
          startedAt: log ? log.startedAt : null,
          completedAt: log ? log.completedAt : null
        };
      });

      return res.json(enrichedActivities);
    }
  } catch (error) {
    console.error('Fetch activities error:', error);
    res.status(500).json({ error: 'Failed to fetch activities list.' });
  }
});

// Get individual activity detail (Student or Admin)
router.get('/:id', authenticateToken, async (req, res) => {
  const activityId = parseInt(req.params.id);
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        content: {
          include: { glossaryTerms: true }
        },
        activityLogs: {
          where: { studentId: req.user.id }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    // Secure checking: student can only fetch activities belonging to their group
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

    res.json(activity);
  } catch (error) {
    console.error('Fetch activity detail error:', error);
    res.status(500).json({ error: 'Failed to fetch activity details.' });
  }
});

// Create new activity (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const { groupId, title, type, contentId, orderIndex } = req.body;

  if (!groupId || !title || !type || !contentId) {
    return res.status(400).json({ error: 'groupId, title, type, and contentId are required.' });
  }

  try {
    // Check if group and content exist
    const groupExists = await prisma.group.findUnique({ where: { id: parseInt(groupId) } });
    const contentExists = await prisma.content.findUnique({ where: { id: parseInt(contentId) } });

    if (!groupExists) return res.status(400).json({ error: 'Target group cohort does not exist.' });
    if (!contentExists) return res.status(400).json({ error: 'Target content library entry does not exist.' });

    // Handle orderIndex default
    let finalOrderIndex = parseInt(orderIndex);
    if (isNaN(finalOrderIndex)) {
      const maxOrder = await prisma.activity.aggregate({
        where: { groupId: parseInt(groupId) },
        _max: { orderIndex: true }
      });
      finalOrderIndex = (maxOrder._max.orderIndex ?? 0) + 1;
    }

    const activity = await prisma.activity.create({
      data: {
        groupId: parseInt(groupId),
        title,
        type,
        contentId: parseInt(contentId),
        orderIndex: finalOrderIndex
      },
      include: {
        group: { select: { name: true } }
      }
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create group activity.' });
  }
});

// Update activity details (Admin only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const activityId = parseInt(req.params.id);
  const { title, orderIndex, contentId } = req.body;

  try {
    const data = {};
    if (title) data.title = title;
    if (orderIndex !== undefined) data.orderIndex = parseInt(orderIndex);
    if (contentId !== undefined) data.contentId = parseInt(contentId);

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data,
      include: { group: { select: { name: true } } }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Failed to update activity.' });
  }
});

// Delete activity (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const activityId = parseInt(req.params.id);
  try {
    await prisma.activity.delete({ where: { id: activityId } });
    res.json({ message: 'Activity deleted successfully.' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Failed to delete activity.' });
  }
});

// Manage/Log student progress state updates (Student only)
// Body expects: status ('IN_PROGRESS' or 'COMPLETED')
router.post('/:id/log', authenticateToken, async (req, res) => {
  const activityId = parseInt(req.params.id);
  const { status } = req.body;
  const studentId = req.user.id;

  if (!status || !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (IN_PROGRESS or COMPLETED) is required.' });
  }

  try {
    // Confirm the activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    // Verify activity matches student's group
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

    // Upsert the activity log and deduplicate to handle concurrent React.StrictMode double-renders
    const logs = await prisma.activityLog.findMany({
      where: { studentId, activityId }
    });

    let updatedLog;
    if (logs.length === 0) {
      // First interaction: Create
      updatedLog = await prisma.activityLog.create({
        data: {
          studentId,
          activityId,
          status,
          startedAt: new Date(),
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });
    } else {
      // Update existing record, prioritizing the COMPLETED status and clearing duplicates
      const [primaryLog, ...duplicates] = logs;
      const updateData = { status };
      if (status === 'COMPLETED' && !primaryLog.completedAt) {
        updateData.completedAt = new Date();
      }

      updatedLog = await prisma.activityLog.update({
        where: { id: primaryLog.id },
        data: updateData
      });

      if (duplicates.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { id: { in: duplicates.map(d => d.id) } }
        });
      }
    }

    res.json(updatedLog);
  } catch (error) {
    console.error('Update activity status log error:', error);
    res.status(500).json({ error: 'Failed to log activity status progress.' });
  }
});

export default router;
