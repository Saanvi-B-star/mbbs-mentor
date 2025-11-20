import { PrismaClient, MaterialType } from '@prisma/client';

const prisma = new PrismaClient();

interface ContentData {
  topicName: string;
  title: string;
  content: string;
  summary: string;
  imageUrl?: string;
  source?: string;
}

export async function addContent(data: ContentData) {
  console.log(`Adding content for topic: ${data.topicName}`);

  // 1. Find the topic
  const topic = await prisma.topic.findFirst({
    where: {
      name: {
        contains: data.topicName,
        mode: 'insensitive',
      },
    },
  });

  if (!topic) {
    console.error(`Topic not found: ${data.topicName}`);
    return;
  }

  console.log(`Found topic: ${topic.name} (${topic.id})`);

  // 2. Create Study Material
  const material = await prisma.studyMaterial.create({
    data: {
      topicId: topic.id,
      title: data.title,
      materialType: MaterialType.NOTES,
      content: data.content,
      summary: data.summary,
      thumbnailUrl: data.imageUrl,
      source: data.source,
      isActive: true,
      isPremium: false,
    },
  });

  console.log(`Created study material: ${material.title} (${material.id})`);
}

// Allow running directly if called from command line
if (require.main === module) {
  // Example usage or empty run
  console.log('This script exports a function. Import it to use.');
}
