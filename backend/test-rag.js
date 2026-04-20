const { ragService } = require('./src/modules/rag/rag.service');
async function test() {
  const res = await ragService.queryRag("What is anatomy?");
  console.log(res);
}
test();
