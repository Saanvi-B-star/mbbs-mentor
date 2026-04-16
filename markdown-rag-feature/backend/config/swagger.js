const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Markdown RAG API',
    version: '1.0.0',
    description: 'API for serving Markdown content, ready for RAG integration.',
  },
  servers: [
    {
      url: 'http://localhost:8001',
      description: 'Development server',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
