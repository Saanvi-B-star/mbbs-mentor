// import { PrismaClient } from "@prisma/client";
// import PDFDocument from "pdfkit";
// import fs from "fs";

// const prisma = new PrismaClient();

// async function exportAllNotes() {
//     const materials = await prisma.studyMaterial.findMany({
//         where: {
//             isActive: true,
//             content: { not: null },
//         },
//         include: {
//             topic: {
//                 include: {
//                     subject: true,
//                 },
//             },
//         },
//         orderBy: [
//             { topic: { subject: { mbbsYear: "asc" } } },
//             { topic: { subject: { name: "asc" } } },
//             { topic: { name: "asc" } },
//             { createdAt: "asc" },
//         ],
//     });

//     const doc = new PDFDocument({
//         margin: 50,
//         size: "A4",
//         bufferPages: true,
//     });

//     doc.pipe(fs.createWriteStream("MBBS-All-Notes.pdf"));

//     // Title Page
//     doc.fontSize(24).text("MBBS Comprehensive Notes", { align: "center" });
//     doc.moveDown();
//     doc.fontSize(14).text(`Generated on: ${new Date().toDateString()}`, {
//         align: "center",
//     });

//     doc.addPage();

//     let currentSubject = "";
//     let currentTopic = "";

//     for (const material of materials) {
//         const subjectName = material.topic.subject.name;
//         const topicName = material.topic.name;

//         // SUBJECT HEADER
//         if (subjectName !== currentSubject) {
//             currentSubject = subjectName;
//             currentTopic = "";

//             doc.addPage();
//             doc
//                 .font("Helvetica-Bold")
//                 .fontSize(20)
//                 .text(subjectName);
//             doc.moveDown();
//         }

//         // TOPIC HEADER
//         if (topicName !== currentTopic) {
//             currentTopic = topicName;

//             doc
//                 .font("Helvetica-Bold")
//                 .fontSize(16)
//                 .text(topicName);
//             doc.moveDown(0.5);
//         }

//         // MATERIAL TITLE
//         doc
//             .font("Helvetica-Bold")
//             .fontSize(13)
//             .text(material.title);

//         doc.moveDown(0.3);

//         // MATERIAL CONTENT
//         doc
//             .font("Helvetica")
//             .fontSize(12)
//             .text(material.content ?? "", {
//                 align: "justify",
//             });

//         doc.moveDown(1);
//     }

//     // Footer page numbers
//     const range = doc.bufferedPageRange();
//     const pageCount = range.count;

//     for (let i = 0; i < pageCount; i++) {
//         doc.switchToPage(i);
//         doc.fontSize(10).text(
//             `Page ${i + 1} of ${pageCount}`,
//             50,
//             doc.page.height - 50,
//             { align: "center" }
//         );
//     }

//     doc.end();

//     console.log("✅ PDF Generated: MBBS-All-Notes.pdf");
// }

// exportAllNotes();

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { PrismaClient } from "@prisma/client";
import { mbbsCurriculum } from "../prisma/data/mbbs-curriculum"; // adjust path if needed

const prisma = new PrismaClient();

async function exportAllNotes() {
    console.log("📚 Fetching study materials...");

    const materials = await prisma.studyMaterial.findMany({
        where: {
            isActive: true,
            content: { not: null },
        },
        include: {
            topic: true,
        },
    });

    console.log(`✅ Found ${materials.length} materials`);

    // ---------------------------------------
    // Index materials by topic name
    // ---------------------------------------
    const materialsByTopic: Record<string, typeof materials> = {};

    for (const material of materials) {
        const topicName = material.topic?.name?.trim();
        if (!topicName) continue;

        if (!materialsByTopic[topicName]) {
            materialsByTopic[topicName] = [];
        }

        materialsByTopic[topicName].push(material);
    }

    // ---------------------------------------
    // Create PDF
    // ---------------------------------------
    const outputPath = path.join(
        __dirname,
        "../exports/MBBS_Complete_Notes.pdf"
    );

    // Ensure exports folder exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const doc = new PDFDocument({
        size: "A4",
        margin: 50,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ---------------------------------------
    // Cover Page
    // ---------------------------------------
    doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .text("MBBS Complete Notes", { align: "center" });

    doc.moveDown(2);

    doc
        .font("Helvetica")
        .fontSize(14)
        .text("Generated from MBBS Mentor Platform", {
            align: "center",
        });

    doc.addPage();

    // ---------------------------------------
    // Recursive Topic Renderer
    // ---------------------------------------
    function renderTopic(topic: any, level = 0) {
        const indent = level * 15;
        const topicName = topic.name?.trim();

        // Topic Heading
        doc
            .font("Helvetica-Bold")
            .fontSize(Math.max(14 - level, 11))
            .text(topicName, { indent });

        doc.moveDown(0.5);

        // Render Materials for this Topic
        const topicMaterials = materialsByTopic[topicName] || [];

        for (const material of topicMaterials) {
            // Title
            doc
                .font("Helvetica-Bold")
                .fontSize(12)
                .text(material.title || "Untitled", {
                    indent: indent + 10,
                });

            doc.moveDown(0.3);

            // Content
            doc
                .font("Helvetica")
                .fontSize(11)
                .text(material.content ?? "", {
                    indent: indent + 10,
                    align: "justify",
                });

            doc.moveDown(1);
        }

        // Render children recursively
        if (topic.children && Array.isArray(topic.children)) {
            for (const child of topic.children) {
                renderTopic(child, level + 1);
            }
        }
    }

    // ---------------------------------------
    // MAIN LOOP (Curriculum Driven)
    // ---------------------------------------
    for (const year of mbbsCurriculum) {
        // YEAR PAGE
        doc.addPage();

        doc
            .font("Helvetica-Bold")
            .fontSize(22)
            .text(`Year ${year.year}`, { align: "left" });

        doc.moveDown(1);

        for (const subject of year.subjects) {
            // SUBJECT HEADER
            doc
                .font("Helvetica-Bold")
                .fontSize(18)
                .text(subject.name);

            doc.moveDown(0.5);

            if (subject.description) {
                doc
                    .font("Helvetica-Oblique")
                    .fontSize(11)
                    .text(subject.description);

                doc.moveDown(1);
            }

            // Topics
            for (const topic of subject.topics) {
                renderTopic(topic);
            }

            doc.moveDown(2);
        }
    }

    // ---------------------------------------
    // Finish
    // ---------------------------------------
    doc.end();

    await new Promise<void>((resolve) => {
        stream.on("finish", () => resolve());
    });

    console.log("🎉 PDF exported successfully!");
    console.log(`📄 Location: ${outputPath}`);
}

exportAllNotes()
    .catch((err) => {
        console.error("❌ Error exporting PDF:", err);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });