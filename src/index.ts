const myRequire = createRequire(import.meta.url);
myRequire("dotenv").config();
import { createRequire } from "module";
import soacDailyDDModel from "./SoacDailyDD.js";
import soacYearlyDDModel from "./SoacYearlyDD.js";
import soacTotalDDModel from "./SoacTotalDD.js";
import { WeatherStats } from "./weatherStats.js";
import { createMetricData } from "./createMetricData.js";
import { MetricName } from "./createMetricData.js";
import { metricNames } from "./createMetricData.js";
import { StoredData } from "./createMetricData.js";
const express = myRequire("express");
const bodyParser = myRequire("body-parser");
const MONGODB_URI = process.env.API_KEY;
const MONGODB_URI_DD = process.env.DD_API_KEY;
const mongoose = myRequire("mongoose");
const app = express();
var cors = myRequire("cors");
app.use(cors());
const PORT = process.env.PORT || 4000;
export default app;

let storedData: StoredData = {
  metrics: createMetricData(),
  weather: new WeatherStats(),
};

const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// For reference of connecting two clusters for another day
// https://stackoverflow.com/questions/76358813/how-can-i-connect-two-different-mongodb-clusters-to-my-express-js-backend-using

// Connection to Chris test database
mongoose
  .connect(MONGODB_URI_DD)
  .then(() => console.log("Connected to MongoDB PERSONAL"))
  .catch((err: any) => console.error("MongoDB connection error:", err));

// Connection to SOAC test database
// mongoose
//   .connect(MONGODB_URI)
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((err: any) => console.error("MongoDB connection error:", err));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.listen(PORT, () => {
  console.log(`Server running on Render port ${PORT}`);
});
app.post("/sendData", asyncHandler(sendProcessedData)); // Sends most updated data
app.post("/newDate", asyncHandler(setNewDate)); // Sets new date for the metric
app.get("/health", (req: any, res: any) => {
  res.status(200).send("OK"); // Health check route
});
// Error-handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Error occurred:", err.message);
  res.status(err.status || 500).json({
    error: {
      message: err.message || "Internal Server Error",
    },
  });
});

/**
 *
 * @param req The request object
 * @param res The response object
 * @returns The response object
 * @description Function to get the processed data
 * @throws Error if there is an error getting the processed data
 */
async function sendProcessedData(req: any, res: any) {
  try {
    // Parse request body
    const specificDate = req.body.date;
    const dayAfter = new Date(specificDate);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Get weather data
    // await storedData.weather.storeWeatherData(soacTotalDDModel);

    // Get metric data
    for (const name of metricNames) {
      await storedData.metrics[name].getYearData(soacYearlyDDModel);
      await storedData.metrics[name].calculateTotalDegreeDays(soacDailyDDModel);
    }
    res.json(storedData); // Respond with processed data
  } catch (error) {
    throw new Error("Error occurred in sendProcessedData");
  }
}

/**
 *
 * @param req The request object
 * @param res The response object
 * @returns The response object
 * @description Function to set the new date for the metric
 * @throws Error if there is an error setting the new date
 */
async function setNewDate(req: any, res: any) {
  try {
    const name: MetricName = req.body.name as MetricName;
    const newStartDate = req.body.startDate || null;
    const newEndDate = req.body.endDate || null;

    await storedData.metrics[name].storeNewDate(soacYearlyDDModel, newStartDate, newEndDate);
    res.status(200).json({ message: "Success" });

    // Log the request
    console.log("------------------------------");
    console.log("Change Made");
    console.log("Name:       " + name);
    if (newStartDate != null) console.log("Start Date: " + newStartDate);
    if (newEndDate != null) console.log("End Date:   " + newEndDate);
    console.log("------------------------------");
  } catch (error) {
    res.status(400).json({ message: "Error" });
    throw new Error("Error setting new date");
  }
}

// Call this fucntion every 24 hours at 12:05 am
// for (const name of metricNames) {
//   await storedData.metrics[name].storePrevDD(soacDailyDDModel, soacYearlyDDModel);
// }
