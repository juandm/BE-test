const swaggerJsdoc = require('swagger-jsdoc');
const path = require('node:path');

const options = {
  failOnErrors: true, // Whether or not to throw when parsing errors. Defaults to false.
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Deel Backend test API',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        ApiAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'profile_id',
        },
      },
    },
    // security: {
    //   ApiAuth: [],
    // },
  },
  apis: [path.join(__dirname, '../presentation/http/routes/*.routes.js')],
};

const openApiSpecification = swaggerJsdoc(options);

module.exports = { openApiSpecification };
