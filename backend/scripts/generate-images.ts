import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const IMAGE_DIR = path.join(__dirname, "../generated-images");

if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR);
}

/* ------------------------------------------
STEP 1: Extract Diagram Blueprint
------------------------------------------ */

// async function extractDiagramBlueprint(content: string) {
//     const response = await openai.chat.completions.create({
//         model: "google/gemini-2.0-flash-001",
//         messages: [
//             {
//                 role: "system",
//                 content: `
//     You are a medical diagram planner.

//     From the given notes, extract:
//     - Diagram title
//     - Main labeled parts
//     - Sub-parts (if any)
//     - Flow arrows if needed
//     - Layout type (vertical, horizontal, circular)

//     Return STRICT JSON only:
//     {
//     "title": "",
//     "layout": "",
//     "labels": [
//         { "name": "", "description": "" }
//     ]
//     }
//             `,
//             },
//             {
//                 role: "user",
//                 content: content,
//             },
//         ],
//     });

//     const raw = response.choices?.[0]?.message?.content ?? "{}";

//     // Remove markdown code fences if present
//     const cleaned = raw
//         .replace(/```json/g, "")
//         .replace(/```/g, "")
//         .trim();

//     try {
//         return JSON.parse(cleaned);
//     } catch {
//         console.log("Blueprint parsing failed. Raw output:");
//         console.log(raw);

//         return {
//             title: "Medical Diagram",
//             layout: "vertical",
//             labels: [],
//         };
//     }
// }

async function extractDiagramBlueprint(content: string) {
    const response = await openai.chat.completions.create({
        model: "google/gemini-2.0-flash-001",
        messages: [
            {
                role: "system",
                content: `
You are a medical diagram planner for MBBS students.

From the given notes, extract information to draw a DIAGRAM (not a table).
Think of how a medical student would draw this in an exam — boxes connected by arrows, 
anatomical structures with label lines, flow charts, or hierarchical trees.

Return STRICT JSON only:
{
  "title": "",
  "layout": "flowchart | hierarchical | anatomical | circular",
  "labels": [
    { "name": "", "description": "" }
  ]
}

IMPORTANT: labels should be the KEY parts of the diagram that would be drawn and pointed to with arrows.
Maximum 8 labels. Keep descriptions short (under 10 words each).
                `,
            },
            {
                role: "user",
                content: content,
            },
        ],
    });

    const raw = response.choices?.[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        console.log("Blueprint parsing failed. Raw output:");
        console.log(raw);
        return {
            title: "Medical Diagram",
            layout: "hierarchical",
            labels: [],
        };
    }
}

/* ------------------------------------------
STEP 2: Build Prompt
------------------------------------------ */

// function buildNanoBananaPrompt(blueprint: any) {
//     return `
//     Create a clean, exam-ready medical diagram with the following specifications:

//     Title: ${blueprint.title}

//     Layout: ${blueprint.layout}

//     Requirements:
//     - White background
//     - Black thin lines
//     - Clear readable labels
//     - Arrows where necessary
//     - Professional textbook style
//     - No artistic styling
//     - No colors
//     - No extra decorations

//     Labels:
//     ${blueprint.labels
//             ?.map(
//                 (label: any) =>
//                     `- ${label.name}: ${label.description}`
//             )
//             .join("\n")}

//     The diagram must look like an MBBS exam answer sheet drawing.
//     `;
// }

function buildNanoBananaPrompt(blueprint: any) {
    return `
Draw a hand-drawn style medical diagram suitable for an MBBS exam answer sheet.

Title: ${blueprint.title}

Layout: ${blueprint.layout}

STRICT RULES:
- Draw actual anatomical/medical DIAGRAM with labeled parts connected by lines or arrows
- Use boxes with labels and arrows showing relationships or flow
- NO tables, NO grids, NO spreadsheet-style layout
- White background, black ink only
- Clean, simple lines like a student would draw in an exam
- Each label should point to a specific part with a line/arrow
- Include the title at the top, underlined

Parts to label and show in the diagram:
${blueprint.labels
            ?.map((label: any) => `- ${label.name}: ${label.description}`)
            .join("\n")}

The final output must look like a hand-drawn medical diagram from an MBBS textbook or exam sheet — NOT a table or chart.
    `;
}

/* ------------------------------------------
STEP 3: Generate Image
------------------------------------------ */

// async function generateDiagramImage(
//     prompt: string,
//     materialId: string
// ) {
//     const response = await openai.chat.completions.create({
//         model: "google/gemini-2.5-flash-image",
//         messages: [
//             {
//                 role: "user",
//                 content: prompt,
//             },
//         ],
//     });

//     console.log(JSON.stringify(response, null, 2));

//     const message: any = response.choices?.[0]?.message;

//     console.log("🔍 message.content type:", typeof message?.content);
//     console.log("🔍 message.content:", JSON.stringify(message?.content, null, 2));
//     console.log("🔍 message keys:", Object.keys(message ?? {}));

//     let base64Data: string | null = null;

//     // CASE 0: OpenRouter stores images in message.images (non-standard field)
//     if (Array.isArray(message?.images) && message.images.length > 0) {
//         const img = message.images[0];

//         if (typeof img === "string" && img.length > 1000) {
//             base64Data = img;
//             console.log("✅ Image found in message.images[0] (string)");
//         } else if (img?.url && img.url.length > 1000) {
//             base64Data = img.url;
//             console.log("✅ Image found in message.images[0].url");
//         } else if (img?.data && img.data.length > 1000) {
//             base64Data = img.data;
//             console.log("✅ Image found in message.images[0].data");
//         }
//     }

//     // CASE 1: Content is an array (Gemini image response via OpenRouter)
//     if (Array.isArray(message?.content)) {
//         const imageObj = message.content.find(
//             (item: any) => item?.type === "image_url"
//         );
//         if (imageObj?.image_url?.url && imageObj.image_url.url.length > 1000) {
//             base64Data = imageObj.image_url.url;
//             console.log("✅ Image found in content array");
//         }
//     }

//     // CASE 2: tool_calls fallback (only if CASE 1 failed)
//     if (!base64Data) {
//         const toolCalls = message?.tool_calls;
//         if (Array.isArray(toolCalls) && toolCalls.length > 0) {
//             let args = toolCalls[0]?.function?.arguments;
//             if (typeof args === "string") {
//                 try {
//                     args = JSON.parse(args);
//                 } catch {
//                     console.log("❌ Failed to parse tool_call arguments");
//                 }
//             }
//             if (args?.image_url?.url && args.image_url.url.length > 1000) {
//                 base64Data = args.image_url.url;
//                 console.log("✅ Image found in tool_calls");
//             }
//         }
//     }

//     // CASE 3: Content is a plain string fallback
//     if (!base64Data && typeof message?.content === "string" && message.content.length > 1000) {
//         base64Data = message.content;
//         console.log("✅ Image found in string content");
//     }

//     if (!base64Data) {
//         console.log("❌ Image extraction failed — no valid image data found in response");
//         return;
//     }

//     // Strip data URL prefix if present
//     if (base64Data.startsWith("data:image")) {
//         const parts = base64Data.split(",");
//         if (parts.length > 1 && parts[1]) {
//             base64Data = parts[1];
//         } else {
//             console.log("❌ Invalid base64 data URL format");
//             return;
//         }
//     }

//     // Clean up any stray quotes or whitespace
//     base64Data = base64Data
//         .replace(/^"+|"+$/g, "")
//         .trim();

//     console.log("✅ Base64 length:", base64Data.length);

//     if (base64Data.length < 1000) {
//         console.log("❌ Base64 data too small after cleaning — likely wrong field");
//         return;
//     }

//     const buffer = Buffer.from(base64Data, "base64");
//     const filePath = path.join(IMAGE_DIR, `${materialId}.png`);
//     fs.writeFileSync(filePath, buffer);

//     console.log("✅ Saved image:", filePath);
// }

async function generateDiagramImage(prompt: string, materialId: string) {
    const rawResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: prompt }],
        }),
    });

    const responseText = await rawResponse.text();

    // Dump full response to file so we can inspect it
    const debugPath = path.join(IMAGE_DIR, `${materialId}-debug.json`);
    fs.writeFileSync(debugPath, responseText);
    console.log("📦 Full response written to:", debugPath);

    // Parse and walk the JSON to find any string > 1000 chars (the image)
    let base64Data: string | null = null;

    function deepFind(obj: any) {
        if (!obj || base64Data) return;
        if (typeof obj === "string" && obj.length > 1000) {
            // Likely the base64 blob
            base64Data = obj;
            return;
        }
        if (typeof obj === "object") {
            for (const key of Object.keys(obj)) {
                deepFind(obj[key]);
                if (base64Data) return;
            }
        }
        if (Array.isArray(obj)) {
            for (const item of obj) {
                deepFind(item);
                if (base64Data) return;
            }
        }
    }

    try {
        const parsed = JSON.parse(responseText);
        deepFind(parsed);
    } catch (e) {
        console.log("❌ Failed to parse response JSON:", e);
        return;
    }

    if (!base64Data) {
        console.log("❌ No large string blob found anywhere in response");
        return;
    }

    // Strip data URL prefix if present
    if ((base64Data as string).startsWith("data:image")) {
        const parts = (base64Data as string).split(",");
        base64Data = parts[1] ?? null;
    }

    if (!base64Data) {
        console.log("❌ base64 data empty after stripping prefix");
        return;
    }

    base64Data = (base64Data as string).replace(/\s/g, "").trim();
    console.log("✅ Found base64 blob, length:", (base64Data as string).length);

    const buffer = Buffer.from(base64Data as string, "base64");
    const filePath = path.join(IMAGE_DIR, `${materialId}.png`);
    fs.writeFileSync(filePath, buffer);
    console.log("✅ Saved image:", filePath);
}

/* ------------------------------------------
MAIN RUNNER
------------------------------------------ */

async function run() {
    try {
        const materials = await prisma.studyMaterial.findMany({
            where: {
                content: {
                    not: null,
                },
            },
            take: 3, // 🔥 CHANGE THIS LATER
        });

        for (const material of materials) {
            try {
                console.log("Processing:", material.title);

                if (!material.content) continue;

                const blueprint = await extractDiagramBlueprint(material.content);
                const prompt = buildNanoBananaPrompt(blueprint);
                await generateDiagramImage(prompt, material.id);
            } catch (error) {
                console.log("Error processing:", material.title, error);
            }
        }
    } catch (error) {
        console.error("Script failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

run();