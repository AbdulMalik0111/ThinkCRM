import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ThinkCRM API',
      version: '1.0.0',
      description: 'API documentation for ThinkCRM Backend',
    },
    servers: [
      {
        url: 'https://thinkcrm.onrender.com/api/v1',
        description: 'Production Server (Render)',
      },
      {
        url: '/api/v1',
        description: 'Current Origin',
      },
      {
        url: 'http://localhost:5050/api/v1',
        description: 'Localhost Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(options);
