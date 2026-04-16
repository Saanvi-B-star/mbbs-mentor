/**
 * Rebuild RAG Index — Admin Script
 * Run with: npx ts-node scripts/rebuildRagIndex.ts
 */

import { ragService } from '../src/modules/rag/rag.service';

async function main() {
  console.log('🔨  Starting RAG index rebuild...');

  try {
    const result = await ragService.buildIndex();
    console.log('✅  Index build complete!');
    console.log(`   Nodes indexed : ${result.nodesIndexed}`);
    console.log(`   Time taken    : ${(result.timeTakenMs / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error('❌  Index build failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
