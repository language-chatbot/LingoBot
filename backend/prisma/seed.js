import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // 1. Clear database tables in logical order
  await prisma.chatLog.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.glossaryTerm.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.content.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();

  console.log('Database tables cleared.');

  // 2. Create Groups
  const group1 = await prisma.group.create({
    data: {
      name: 'Korean Middle School',
      description: 'Intermediate Korean learning cohort for grade 8 students.'
    }
  });

  const group2 = await prisma.group.create({
    data: {
      name: 'Japanese University Cohort A',
      description: 'Introductory Japanese conversation cohort.'
    }
  });

  console.log('Groups created:', [group1.name, group2.name]);

  // 3. Create Users (Admin & Students)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Teacher Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN'
    }
  });

  const student1 = await prisma.user.create({
    data: {
      name: 'Alice Student',
      email: 'student@example.com',
      passwordHash,
      role: 'STUDENT',
      groups: { connect: { id: group1.id } }
    }
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Bob Student',
      email: 'student2@example.com',
      passwordHash,
      role: 'STUDENT',
      groups: { connect: { id: group2.id } }
    }
  });

  console.log('Users created:', {
    admin: admin.email,
    student1: student1.email,
    student2: student2.email
  });

  // 4. Create Content
  // A: Reading Passage
  const passageText = `Welcome to Seoul! Seoul is the historic and energetic capital of South Korea. Today we will start our walking tour in the heart of the city. Our first stop is Gyeongbokgung palace, the primary royal residence built during the Joseon dynasty. The architecture is beautiful, and you will see many people wearing Hanbok, which is traditional Korean clothing. After exploring the palace grounds, we will visit a local restaurant to eat delicious Kimchi and warm Bibimbap. Make sure to try these dishes to understand Korean culinary culture.`;

  const readingContent = await prisma.content.create({
    data: {
      type: 'READING',
      textBody: passageText
    }
  });

  // Programmatically find offsets to ensure correctness
  const glossaryData = [
    { term: 'Seoul', definition: 'The capital and largest metropolis of South Korea, located on the Han River.' },
    { term: 'Gyeongbokgung', definition: 'The main royal palace of the Joseon dynasty, built in 1395 in northern Seoul.' },
    { term: 'palace', definition: 'A large, grand residence, especially for royal families or heads of state.' },
    { term: 'Hanbok', definition: 'Traditional Korean clothing, characterized by vibrant colors and simple lines without pockets.' },
    { term: 'Kimchi', definition: 'A staple side dish in Korean cuisine, made of salted and fermented vegetables, most commonly napa cabbages and radishes, with chili powder, garlic, and ginger.' },
    { term: 'Bibimbap', definition: 'A popular Korean rice dish topped with seasoned vegetables, meat, raw or fried egg, and gochujang (chili pepper paste).' }
  ];

  for (const item of glossaryData) {
    const startOffset = passageText.indexOf(item.term);
    if (startOffset !== -1) {
      const endOffset = startOffset + item.term.length;
      await prisma.glossaryTerm.create({
        data: {
          contentId: readingContent.id,
          term: item.term,
          definition: item.definition,
          startOffset,
          endOffset
        }
      });
    }
  }

  // B: Listening Content (Audio file reference)
  const listeningContent = await prisma.content.create({
    data: {
      type: 'LISTENING',
      fileUrl: 'https://www.w3schools.com/html/horse.mp3'
    }
  });

  // C: Video Content (Video file reference)
  const videoContent = await prisma.content.create({
    data: {
      type: 'VIDEO',
      fileUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  });

  console.log('Content and glossary terms created.');

  // 5. Create Activities
  // Tie content items to group1 (Korean Middle School)
  const activity1 = await prisma.activity.create({
    data: {
      groupId: group1.id,
      title: 'Exploring Seoul: Reading Comprehension',
      type: 'READING',
      contentId: readingContent.id,
      orderIndex: 1
    }
  });

  const activity2 = await prisma.activity.create({
    data: {
      groupId: group1.id,
      title: 'Seoul City Audio Tour Guide',
      type: 'LISTENING',
      contentId: listeningContent.id,
      orderIndex: 2
    }
  });

  const activity3 = await prisma.activity.create({
    data: {
      groupId: group1.id,
      title: 'Seoul Travel Vlog: Visual Tour',
      type: 'VIDEO',
      contentId: videoContent.id,
      orderIndex: 3
    }
  });

  console.log('Activities created for Korean Middle School cohort.');

  // Create simple reading activity for Japanese University Cohort A to ensure they have things to do
  const activityJapanese = await prisma.activity.create({
    data: {
      groupId: group2.id,
      title: 'Introduction to Japanese University: Reading',
      type: 'READING',
      contentId: readingContent.id, // Re-use the reading content for simplicity
      orderIndex: 1
    }
  });

  console.log('Activities created for Japanese University cohort.');

  // 6. Create initial activity progress logs for demonstration
  await prisma.activityLog.create({
    data: {
      studentId: student1.id,
      activityId: activity1.id,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }
  });

  // Create a mock conversation log
  await prisma.chatLog.create({
    data: {
      studentId: student1.id,
      activityId: activity1.id,
      role: 'user',
      message: 'Hello! I am reading about Seoul. What is a Hanbok?'
    }
  });

  await prisma.chatLog.create({
    data: {
      studentId: student1.id,
      activityId: activity1.id,
      role: 'assistant',
      message: 'Hello Alice! A Hanbok is traditional Korean clothing. As mentioned in the text, it is known for its beautiful architecture-like fit and vibrant colors. People often wear it when visiting historic sites like Gyeongbokgung palace!'
    }
  });

  console.log('Activity and chat logs seeded.');
  console.log('Database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Seeding process encountered an error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
