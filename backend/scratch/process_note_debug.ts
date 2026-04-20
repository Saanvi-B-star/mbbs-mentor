import { notesProcessor } from '../src/modules/notes/notes.processor';
import { prisma } from '../src/config';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function debugProcessNote() {
    const noteId = 'cmo2mlgsr000db6aavbqg83gm';
    console.log(`--- Debug: Processing Note ${noteId} ---`);
    
    try {
        await notesProcessor.processNote(noteId);
        
        console.log('\n--- SUCCESS ---');
        const note = await prisma.userNote.findUnique({ where: { id: noteId } });
        console.log('Status:', note?.processingStatus);
        console.log('Summary Preview:', note?.summary?.substring(0, 200), '...');
        console.log('Formatted Notes Preview:', note?.formattedNotes?.substring(0, 200), '...');
        console.log('Word Count:', note?.wordCount);
        console.log('Processing Time:', note?.processingTime, 's');
    } catch (err) {
        console.error('\n--- FAILED ---');
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

debugProcessNote();
