import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

// Register a new user (public signup as Student, or admin-triggered creation)
router.post('/register', async (req, res) => {
  const { name, email, password, role, groupId } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email address is already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'STUDENT';

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: userRole,
        groups: userRole === 'STUDENT' && groupId ? {
          connect: { id: parseInt(groupId) }
        } : undefined
      },
      include: { groups: true }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, groups: user.groups.map(g => g.id) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        groups: user.groups
      }
    });
  } catch (error) {
    console.error('Registration processing error:', error);
    res.status(500).json({ error: 'Failed to process account registration.' });
  }
});

// Authenticate and obtain JWT session
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { groups: true }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email credentials or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email credentials or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, groups: user.groups.map(g => g.id) },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        groups: user.groups
      }
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ error: 'Failed to authenticate user credentials.' });
  }
});

// Fetch active profile context
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { groups: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Account context not found.' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        groups: user.groups
      }
    });
  } catch (error) {
    console.error('Session details reading error:', error);
    res.status(500).json({ error: 'Failed to read current session details.' });
  }
});

export default router;
