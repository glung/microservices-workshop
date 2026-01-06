import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Course Platform API',
      version: '1.0.0',
      description: 'A monolithic course platform API with authentication, course catalog, and subscription management',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
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
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            subscription_kind: {
              type: 'string',
              enum: ['Free', 'Max'],
              description: 'Type of subscription',
            },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Course ID',
            },
            name: {
              type: 'string',
              description: 'Course name',
            },
            author: {
              type: 'string',
              description: 'Course author',
            },
            kind: {
              type: 'string',
              enum: ['Free', 'Max'],
              description: 'Course type',
            },
            content: {
              type: 'string',
              description: 'Course content (only available for authorized users)',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Course creation date',
            },
            like_count: {
              type: 'integer',
              description: 'Number of likes',
            },
            is_liked: {
              type: 'boolean',
              description: 'Whether the current user has liked this course',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
  },
  apis: process.env.NODE_ENV === 'production'
    ? ['./dist/routes/*.js', './dist/index.js']
    : ['./src/routes/*.ts', './src/index.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
