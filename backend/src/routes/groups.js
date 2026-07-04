import express from 'express';
import prisma from '../services/prisma.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List cohorts (Admins and Students see all available groups so students can self-select)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: {
          select: { users: true, activities: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.json(groups);
  } catch (error) {
    console.error('Fetch groups error:', error);
    res.status(500).json({ error: 'Failed to fetch learning groups.' });
  }
});

// Get group detail (Admin only)
router.get('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, createdAt: true }
        },
        activities: {
          orderBy: { orderIndex: 'asc' },
          include: { content: true }
        }
      }
    });

    if (!group) {
      return res.status(404).json({ error: 'Group cohort not found.' });
    }

    res.json(group);
  } catch (error) {
    console.error('Fetch group detail error:', error);
    res.status(500).json({ error: 'Failed to fetch group details.' });
  }
});

// Create new group (Admin only)
router.post('/', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  try {
    const group = await prisma.group.create({
      data: { name, description }
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A group with this name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

// Update group (Admin only)
router.put('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  try {
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { name, description }
    });
    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ error: 'Failed to update group details.' });
  }
});

// Delete group (Admin only)
router.delete('/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  try {
    await prisma.group.delete({ where: { id: groupId } });
    res.json({ message: 'Group deleted successfully.' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Failed to delete group.' });
  }
});

// Fetch roster of students in a group (Admin only)
router.get('/:id/roster', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  try {
    const students = await prisma.user.findMany({
      where: {
        groups: { some: { id: groupId } },
        role: 'STUDENT'
      },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    res.json(students);
  } catch (error) {
    console.error('Fetch group roster error:', error);
    res.status(500).json({ error: 'Failed to fetch group roster.' });
  }
});

// Assign student user to cohort group (Admin only)
router.post('/:id/assign', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: {
        groups: { connect: { id: groupId } }
      }
    });
    res.json({ message: `Successfully assigned student ${updatedUser.name} to cohort.` });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({ error: 'Failed to assign student to group.' });
  }
});

// Remove student from group (Admin only)
router.post('/:id/unassign', authenticateToken, requireRole('ADMIN'), async (req, res) => {
  const groupId = parseInt(req.params.id);
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required.' });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(studentId) },
      data: {
        groups: { disconnect: { id: groupId } }
      }
    });
    res.json({ message: `Successfully removed student ${updatedUser.name} from cohort.` });
  } catch (error) {
    console.error('Remove student error:', error);
    res.status(500).json({ error: 'Failed to remove student from group.' });
  }
});

// Join a cohort group (Student only)
router.post('/:id/join', authenticateToken, async (req, res) => {
  const groupId = parseInt(req.params.id);
  const studentId = req.user.id;

  try {
    // Idempotently connect student to the chosen group
    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: {
        groups: { connect: { id: groupId } }
      }
    });
    res.json({ message: `Successfully joined group ${groupId}` });
  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({ error: 'Failed to join group.' });
  }
});

export default router;
