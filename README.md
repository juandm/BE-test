
This is my solution to the backend [task](./task.md), in the 3 hours time window I basically developed the endpoints all in the `app.js` file, I'm not experienced with Squelize.

After finishing that initial solution, iterated over the codebase and refactored to decouple better responsibilities and isolate components. Moreover, added linter support and a OpenApi documentation to the API.

## Instructions

1. Clone the code
2. Run `npm install`
3. Run `npm run seed`
4. Run `npm start`


Once the server is running you will be able to reach the API documentation going to http://localhost:3001/api-docs.

To set the header `profile_id` used for authentication click in the padlock located at the top right (Authorize) and add the `id` of the user you want to test. After that you will be able to hit the API using the Swagger page.
