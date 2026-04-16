/**
 * Service to generate Markdown content.
 * Designed to be replaced or augmented with a RAG model pipeline later.
 */
const generateMarkdownContent = async () => {
  // Simulate an asynchronous operation, such as an LLM RAG completion.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("# Patient Guidelines\n\n- Take medicines on time\n- Drink enough water\n- Avoid oily food");
    }, 100);
  });
};

module.exports = {
  generateMarkdownContent,
};
