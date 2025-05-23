# Degree Day App Server

## Back-End

The back end of this project is written using Typescript. The tought behind making the switch from JavaScript to TypeScript was to type check the information that is getting parsed and sent to the front end. It connects to mongoDB through mongoose and Express.js, as well as accepting a post request to handle the async data pull and a /get to check health status of the server.

## Back-End Tech Used

- TypeScript
- Node.js
- Express.js
- Mongoose
- Docker

## Run / Build / Stop

Process to get server up and running for production:

Install Docker and Docker Compose on your system that will host the server.

Git clone your repo to your machine
```
git clone https://your-github-repo/project
```

Add .env to project
```
cd /your-project-root-dir
nano .env
```

In .env add info
```
API_URL=yourapiurl
PORT=portnum
```

Build and Run commands 
```
docker compose build
docker compose up -d
```

Check to make sure your container is live and free of errors
```
docker compose ps
```

To stop your server
```
docker compose down
```

## Database Integration

Steps to include your mongoDB connection into this backend:

1. Create a `.env` file in the root directory of the project
2. After adding your api key to the .env file, if different add your api key name to `<your-api>` in `process.env.<your-api>` located inside index.ts
3. Modify `SoacDailyDD.ts` and `SoacYearlyDD.ts` schemas to match your specific dataset
4. Follow Run / Build / Stop instructions above

## Metric Alter

Locations to change tailored metrics:

- Inside `metric.ts` and `weatherStats.ts` classes you can alter the data points and metrics you want to track
- Inside `createMetricData.ts` you can initialize your metric class instances with specific data
