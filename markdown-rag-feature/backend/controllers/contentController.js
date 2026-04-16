const contentService = require('../services/contentService');

/**
 * Handles the GET request for content.
 */
const getContent = async (req, res) => {
  try {
    // We await the service here in preparation for future async RAG integration
    const content = await contentService.generateMarkdownContent();
    res.status(200).json({ content });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getContent,
};
