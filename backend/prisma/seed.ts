import { PrismaClient } from '@prisma/client';
import { mbbsCurriculum } from './data/mbbs-curriculum';

const prisma = new PrismaClient();

interface TopicData {
  name: string;
  description?: string;
  children?: TopicData[];
}

interface SubjectData {
  name: string;
  code: string;
  description: string;
  topics: TopicData[];
}

interface YearData {
  year: number;
  subjects: SubjectData[];
}

async function main() {
  console.log('Start seeding...');

  for (const yearData of mbbsCurriculum as unknown as YearData[]) {
    const year = yearData.year;
    console.log(`Processing Year ${year}...`);

    for (const subjectData of yearData.subjects) {
      console.log(`  Processing Subject: ${subjectData.name}`);

      const subject = await prisma.subject.upsert({
        where: { code: subjectData.code },
        update: {
          name: subjectData.name,
          description: subjectData.description,
          mbbsYear: year,
        },
        create: {
          name: subjectData.name,
          code: subjectData.code,
          description: subjectData.description,
          mbbsYear: year,
          isActive: true,
        },
      });

      for (const topicData of subjectData.topics) {
        console.log(`    Processing Topic: ${topicData.name}`);

        const topic = await prisma.topic.create({
          data: {
            name: topicData.name,
            description: topicData.description,
            subjectId: subject.id,
            isActive: true,
          },
        });

        if (topicData.children && topicData.children.length > 0) {
          for (const childTopicData of topicData.children) {
            console.log(`      Processing Sub-topic: ${childTopicData.name}`);
            await prisma.topic.create({
              data: {
                name: childTopicData.name,
                description: childTopicData.description,
                subjectId: subject.id,
                parentTopicId: topic.id,
                isActive: true,
              },
            });
          }
        }
      }
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
