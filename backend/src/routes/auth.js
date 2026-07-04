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

// Temporary endpoint to seed database directly on Render (accessible without external DB connection)
router.get('/temp-seed', async (req, res) => {
  try {
    // 1. Create cohort groups if they don't exist
    const schoolGroup = await prisma.group.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Korean Middle School',
        description: 'Beginner Korean for Middle School students.'
      }
    });

    const uniGroup = await prisma.group.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: 'Japanese University Cohort A',
        description: 'Intermediate Japanese for university level.'
      }
    });

    // 2. Create default Admin if doesn't exist
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash('password123', salt);

    const adminEmail = 'admin@example.com';
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: 'Teacher Admin',
          email: adminEmail,
          passwordHash: hashPassword,
          role: 'ADMIN'
        }
      });
    }

    // 3. Create default Students if they don't exist
    const student1Email = 'student@example.com';
    let student1 = await prisma.user.findUnique({ where: { email: student1Email } });
    if (!student1) {
      student1 = await prisma.user.create({
        data: {
          name: 'Bob Student',
          email: student1Email,
          passwordHash: hashPassword,
          role: 'STUDENT',
          groups: { connect: { id: schoolGroup.id } }
        }
      });
    }

    const student2Email = 'student2@example.com';
    let student2 = await prisma.user.findUnique({ where: { email: student2Email } });
    if (!student2) {
      student2 = await prisma.user.create({
        data: {
          name: 'Alice Student',
          email: student2Email,
          passwordHash: hashPassword,
          role: 'STUDENT',
          groups: { connect: { id: uniGroup.id } }
        }
      });
    }

    // 4. Create content library templates if they don't exist
    let readingContent = await prisma.content.findFirst({ where: { type: 'READING' } });
    if (!readingContent) {
      readingContent = await prisma.content.create({
        data: {
          type: 'READING',
          textBody: `Welcome to Seoul, the capital city of South Korea! Seoul is a historic and energetic city where modern technology meets traditional culture. Today, we will embark on a walking tour through the heart of the city.

Our first stop is Gyeongbokgung Palace, the main royal residence during the Joseon dynasty. Look at the beautiful architecture and the colorful patterns on the roofs. Many visitors enjoy wearing Hanbok, the traditional Korean clothing, while walking around the palace grounds.

After exploring the palace, we will visit a local restaurant to try some traditional Korean food, such as Kimchi and Bibimbap.`
        }
      });

      // Glossary Terms
      const glossaryTerms = [
        { term: 'Seoul', definition: 'The capital and largest metropolis of South Korea.', startOffset: 11, endOffset: 16 },
        { term: 'Gyeongbokgung Palace', definition: 'The main royal palace of the Joseon dynasty, built in 1395.', startOffset: 201, endOffset: 221 },
        { term: 'Joseon dynasty', definition: 'A Korean dynastic kingdom that lasted for five centuries (1392–1910).', startOffset: 254, endOffset: 268 },
        { term: 'Hanbok', definition: 'Traditional Korean clothing, characterized by vibrant colors and simple lines without pockets.', startOffset: 345, endOffset: 351 },
        { term: 'Kimchi', definition: 'A traditional Korean side dish of salted and fermented vegetables, most commonly napa cabbage and radishes.', startOffset: 486, endOffset: 492 },
        { term: 'Bibimbap', definition: 'A Korean rice dish topped with seasoned vegetables, chili pepper paste, soy sauce, and a raw or fried egg.', startOffset: 497, endOffset: 505 }
      ];

      for (const term of glossaryTerms) {
        await prisma.glossaryTerm.create({
          data: {
            contentId: readingContent.id,
            term: term.term,
            definition: term.definition,
            startOffset: term.startOffset,
            endOffset: term.endOffset
          }
        });
      }
    }

    let listeningContent = await prisma.content.findFirst({ where: { type: 'LISTENING' } });
    if (!listeningContent) {
      listeningContent = await prisma.content.create({
        data: {
          type: 'LISTENING',
          fileUrl: 'https://www.w3schools.com/html/horse.mp3'
        }
      });
    }

    let videoContent = await prisma.content.findFirst({ where: { type: 'VIDEO' } });
    if (!videoContent) {
      videoContent = await prisma.content.create({
        data: {
          type: 'VIDEO',
          fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
        }
      });
    }

    // 5. Create default activities if they don't exist
    const actCount = await prisma.activity.count();
    if (actCount === 0) {
      await prisma.activity.create({
        data: {
          title: 'Reading Comprehension: Seoul History',
          description: 'Read the text about Gyeongbokgung Palace and vocabulary terms.',
          type: 'READING',
          orderIndex: 1,
          groupId: schoolGroup.id,
          contentId: readingContent.id
        }
      });

      await prisma.activity.create({
        data: {
          title: 'Seoul City Audio Tour Guide',
          description: 'Listen to the audio guide and learn vocabulary pronunciation.',
          type: 'LISTENING',
          orderIndex: 2,
          groupId: schoolGroup.id,
          contentId: listeningContent.id
        }
      });

      await prisma.activity.create({
        data: {
          title: 'Seoul Travel Vlog: Visual Tour',
          description: 'Watch the travel vlog to explore Korean street food and landmarks.',
          type: 'VIDEO',
          orderIndex: 3,
          groupId: schoolGroup.id,
          contentId: videoContent.id
        }
      });

      await prisma.activity.create({
        data: {
          title: 'Tokyo Street Reading Exercise',
          description: 'Read basic Kanji and Hiragana structures from Tokyo transit maps.',
          type: 'READING',
          orderIndex: 1,
          groupId: uniGroup.id,
          contentId: readingContent.id
        }
      });
    }

    res.json({
      message: 'Render database seeded successfully!',
      credentials: {
        admin: { email: adminEmail, password: 'password123' },
        student1: { email: student1Email, password: 'password123' },
        student2: { email: student2Email, password: 'password123' }
      }
    });
  } catch (error) {
    console.error('Render temp-seed error:', error);
    res.status(500).json({ error: 'Failed to seed Render database.', details: error.message });
  }
});

export default router;
