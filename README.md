# Degree Day App Server

## Back-End

The back end of this project is written using Typescript. The tought behind making the switch from JavaScript to TypeScript was to type check the information that is getting parsed and sent to the front end. It connects to mongoDB through mongoose and Express.js, as well as accepting a post request to handle the async data pull and a /get to check health status of the server.

## Back-End Tech Used

- TypeScript
- Node.js
- Express.js
- Mongoose

## Run / Build

Process to build and run build for production:

```
npm run build
npm run start
```

## Database Integration

Steps to include your mongoDB connection into this backend:

1. Create a `.env` file in the root directory of the project
2. After adding your api key to the .env file, add you api key to the `process.env.<your-api>` located inside index.ts
3. Modify `SoacDailyDD.ts` and `SoacYearlyDD.ts` schemas to match your specific dataset
4. `npm run build` to build the project
5. `npm run dev` to test api connection to mongoDB
6. Message in console should read "Connected to MongoDB"

## Metric Alter

Change tailored metrics:

- Inside `metric.ts` and `weatherStats.ts` classes you can alter the data points and metrics you want to track
- Inside `createMetricData.ts` you can initialize your metric class instances with specific data
