# Degree Day App Server
## Back-End Tech Used
- TypeScript
- Node.js
- Express.js
- Mongoose
- Docker

## Build / Run
Process to build and run for production:

```
docker compose build
docker compose up -d
docker compose ps # To confirm backend is running
```

## Stop 
Process to stop production

```
docker compose down
docker compose ps # To confirm backend stopped
```

## Database Integration
Steps to include your mongoDB connection into this backend:

1. Create a `.env` file in the root directory of the project
2. After adding your api key to the .env file, add you api key name to `<your-api>` in `process.env.<your-api>` located inside index.ts
3. Modify `SoacDailyDD.ts` and `SoacYearlyDD.ts` schemas to match your specific dataset
4. `docker compose build` to build the project
5. `docker compose up -d` to test api connection to mongoDB
6. Message in console should read "Connected to MongoDB"

## Metric Alter
Locations to change tailored metrics:

- Inside `metric.ts` and `weatherStats.ts` classes you can alter the data points and metrics you want to track
- Inside `createMetricData.ts` you can initialize your metric class instances with specific data

## Layout of Backend

### Endpoints
The endpoints are located inside of the index.ts file, starting on line 47. This is the centralized location that the client end of the application will connect to the backend logic.

#### /send-fast
 - This endpoint is a get request that will return JSON with the most current and up-to-date information for all pest, crop, and weather. Structured as /data/metrics/.. /data/weather/..

 GET /send-fast

#### /new-date
 - This endpoint is a post request that accepts a body with the parameters {name, startDate (optional), endDate (optional)}. The startDate and endDate are optional but at least one must be present to change a date, but could also accept both at the same time.

 POST /new-date
{
  "name": "ExampleMetric",
  "startDate": "2024-03-01",
  "endDate": "2024-10-15"
}

#### /add-metric
 - This endpoint lets you add a new metric to the database. It is a post request that accepts the parameters of {name, type, start_date, end_date, total_degree_days, active_year, temp_base, temp_max}.

 POST /add-metric
{
  "name": "ExampleMetric",
  "type": "pest",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "total_degree_days": 0,
  "active_year": 2024,
  "temp_base": 50,
  "temp_max": 86
}

#### /remove-metric
 - This endpoint will remove the metric from the database for that specific year. This action cannot be undone, and you will have to re-add the metric and the new calculations will be made for that metric.

 POST /remove-metric
{
    "name": "ExampleMetric",
    "year": 2025
}


#### /re-calc-data
 - This endpoint will re-calculate all metric calculations based off the data available in the database. This will be helpful for if data is altered or added into the database. This could happen if the weather data is not reported and the data needs to be added in at a later date.

 POST /re-calc-data
{
    "year": 2025
}

#### /health
 - This endpoint is used for the backend health checks. A status 200 and message of "OK" will be sent if backend is functional.

 GET /health

### Managing Class
orchardManager.ts

The orchard manager class is used to track all of the backends data. It holds the instances of the database, weather stats, and metrics. This is also used to house all of the endpoint functions logic that fire when the endpoints are called. All endpoint operations will pass through this orchard manager class to keep stuff better organized. This class will also call upon the database logic, weather stat logic and the metrics logic.

### Core classes
#### Metric Database
 - This file has all of the schemas used in the application. In order to use your own database for this backend, you need to change the names to accommodate your own mongoDB names and schema requirements. This file has all mongo connection functions, this makes it easy to only change the schemas and still have the backend work regardless of the database logic you want to change or incorporate. The functions are separated by Daily model methods, Yearly model methods, and Total model methods, for ease of tracking. The schemas are only routed through this database class in order to streamline and maintain the backend.

#### Weather Stats
 - This class is used for tracking the weather stats for the program. It also has the ability to make database calls to change and update information.

#### Metric
 - This class is used for holding all relevant data related to the metrics. It also has the ability to make database calls to change and update information.

### Database connection
#### Soac Daily DD
 - This file houses the schema for the Soac Daily DD collection. This collection is very simple in the fact that it tracks the name, date, and the amount of degree days accumulated for that day. This file also houses all of the logic related to altering, adding, or deleting data from this collection.

#### Soac Total DD
 - This file houses the schema used in the Soac Total DD collection. This is specifically the mass data collected from the weather sensors in the orchard, hence the total name. The schema has the ability to access all the schema metrics but only accesses a few of them to make necessary calculations. This file also houses all of the related logic for pulling data within a range of dates.

#### Soac Yearly DD
 - This file houses the schema used in the Soac Yearly DD collection. This is specifically the yearly data used to store the metric data. This file also houses all the logic related to altering, adding, or deleting data from this collection.

### University of Idaho Metrics Collected Documentation:
1. Time spent writing new communication software: N/A
2. Total new lines of code: 1,671 
3. Number of code files needed: 9 typescript files, 3 docker files, 1 .env file
4. User satisfaction rating: N/A

### Backend Layout Visual
<img src="https://github.com/user-attachments/assets/f13517ec-82ff-43b9-8ada-d8b30507d126" width="450" height="650" title="Backend Layout Visual" alt="Backend Layout Visual"/>
