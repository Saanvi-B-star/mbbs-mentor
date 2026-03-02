import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";

const prisma = new PrismaClient();

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "MBBS Mentor"
    }
});


async function generateNotes() {
    const topics = await prisma.topic.findMany({
        where: {
            studyMaterials: { none: {} }, // only topics without notes
        },
    });

    console.log(`Found ${topics.length} topics`);

    for (const topic of topics) {
        console.log(`Generating notes for: ${topic.name}`);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an MBBS professor. Generate structured textbook-style notes.`,
                },
                {
                    role: "user",
                    content: `
Generate detailed MBBS notes for topic: ${topic.name}

Structure:
1. Definition
2. Classification
3. Etiology
4. Pathophysiology
5. Clinical Features
6. Investigations
7. Management
8. Complications
9. Summary Points
          `,
                },
            ],
            temperature: 0.7,
        });

        const content = response.choices?.[0]?.message?.content ?? "";


        await prisma.studyMaterial.create({
            data: {
                topicId: topic.id,
                title: `${topic.name} - Complete Notes`,
                materialType: "NOTES",
                content,
                isPremium: false,
            },
        });

        console.log(`Saved notes for: ${topic.name}`);
    }

    console.log("All notes generated.");
}

generateNotes()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
